package com.onboardai.invitations;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.mail.EmailDeliveryResult;
import com.onboardai.mail.EmailService;
import com.onboardai.onboarding.*;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.OnboardingTask;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.users.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);

    private final InvitationRepository invitationRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OnboardingPlanRepository planRepository;
    private final OnboardingPlanTaskRepository planTaskRepository;
    private final OnboardingAssignmentRepository assignmentRepository;
    private final OnboardingTaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl = "http://localhost:5173";

    public InvitationService(
            InvitationRepository invitationRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OnboardingPlanRepository planRepository,
            OnboardingPlanTaskRepository planTaskRepository,
            OnboardingAssignmentRepository assignmentRepository,
            OnboardingTaskRepository taskRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditService auditService
    ) {
        this.invitationRepository = invitationRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.planRepository = planRepository;
        this.planTaskRepository = planTaskRepository;
        this.assignmentRepository = assignmentRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Transactional
    public InvitationDto createEmployeeAndInvite(CreateInvitationRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        Role targetRole = request.getRole() != null ? request.getRole() : Role.EMPLOYEE;

        // Enforce role-based permission hierarchy
        if (currentUser.getRole() == Role.HR_MANAGER) {
            if (targetRole == Role.HR_ADMIN || targetRole == Role.HR_MANAGER) {
                throw new UnauthorizedException("HR Managers cannot invite HR Administrators or other HR Managers. Only HR Admins can assign these roles.");
            }
        } else if (currentUser.getRole() != Role.HR_ADMIN) {
            throw new UnauthorizedException("Only HR Administrators and HR Managers are authorized to invite team members.");
        }

        String email = request.getEmail().trim().toLowerCase();

        // 1. Check if an active user account already exists with this email
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && existingUser.get().isActive()) {
            throw new BusinessRuleException("An active user account with email '" + email + "' already exists in OnboardAI.");
        }

        // 2. Check if a pending, unexpired invitation exists for this email
        Optional<Invitation> pendingInv = invitationRepository.findByOrganizationIdAndEmailAndStatus(orgId, email, InvitationStatus.PENDING);
        if (pendingInv.isPresent() && pendingInv.get().getExpiresAt().isAfter(Instant.now())) {
            throw new BusinessRuleException("A pending invitation has already been sent to '" + email + "'. You can resend or revoke the existing invitation.");
        }

        // 3. Employee Code validation or generation
        String employeeCode = request.getEmployeeCode();
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            employeeCode = "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } else {
            employeeCode = employeeCode.trim().toUpperCase();
            if (employeeRepository.existsByOrganizationIdAndEmployeeCode(orgId, employeeCode)) {
                throw new BusinessRuleException("Employee code '" + employeeCode + "' is already assigned to another employee.");
            }
        }

        // 4. Create Employee record (DO NOT create an active user account with a shared password!)
        Employee employee = new Employee(
                orgId,
                null, // user_id is null until account activation
                employeeCode,
                request.getFullName().trim(),
                email,
                request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME",
                request.getDepartment().trim(),
                request.getJobTitle().trim(),
                request.getManagerId(),
                request.getEmploymentStartDate()
        );
        employee = employeeRepository.save(employee);

        // Pre-assign onboarding plan if requested
        if (request.getOnboardingPlanId() != null) {
            preAssignPlan(employee, request.getOnboardingPlanId());
        }

        // 5. Generate cryptographically secure token & SHA-256 hash
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        // 6. Create Invitation record
        Invitation invitation = new Invitation(
                orgId,
                employee.getId(),
                request.getFullName().trim(),
                email,
                request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                request.getDepartment().trim(),
                request.getJobTitle().trim(),
                targetRole,
                request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME",
                tokenHash,
                expiresAt,
                currentUser.getId()
        );
        invitation = invitationRepository.save(invitation);

        // 7. Get organization name for branding
        String orgName = organizationRepository.findById(orgId)
                .map(Organization::getName)
                .orElse("OnboardAI Workspace");

        // 8. Deliver invitation email or generate local development preview
        EmailDeliveryResult emailResult = emailService.sendInvitationEmail(
                email,
                request.getFullName().trim(),
                orgName,
                targetRole.name(),
                rawToken,
                expiresAt
        );

        auditService.recordAction(
                orgId,
                currentUser.getId(),
                "EMPLOYEE_INVITATION_CREATED",
                "Invitation",
                invitation.getId().toString(),
                "Created employee " + employeeCode + " and sent " + targetRole + " invitation to " + email
        );

        return toDto(invitation, rawToken, emailResult);
    }

    @Transactional(readOnly = true)
    public Page<InvitationDto> getInvitations(InvitationStatus status, String search, Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        return invitationRepository.searchInvitations(orgId, status, search, pageable)
                .map(inv -> {
                    checkAndExpireIfNeeded(inv);
                    return toDto(inv, null, null);
                });
    }

    @Transactional(readOnly = true)
    public InvitationDto getInvitationById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Invitation invitation = invitationRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", id));
        checkAndExpireIfNeeded(invitation);
        return toDto(invitation, null, null);
    }

    @Transactional
    public InvitationDto resendInvitation(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        Invitation invitation = invitationRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", id));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new BusinessRuleException("Cannot resend an invitation that has already been accepted.");
        }

        // Generate a new secure token and invalidate the old token
        String newRawToken = generateSecureToken();
        String newTokenHash = hashToken(newRawToken);
        Instant newExpiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        invitation.setTokenHash(newTokenHash);
        invitation.setExpiresAt(newExpiresAt);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setInvitedByUserId(currentUser.getId());
        invitation = invitationRepository.save(invitation);

        String orgName = organizationRepository.findById(orgId)
                .map(Organization::getName)
                .orElse("OnboardAI Workspace");

        EmailDeliveryResult emailResult = emailService.sendInvitationEmail(
                invitation.getEmail(),
                invitation.getFullName(),
                orgName,
                invitation.getRole().name(),
                newRawToken,
                newExpiresAt
        );

        auditService.recordAction(
                orgId,
                currentUser.getId(),
                "EMPLOYEE_INVITATION_RESENT",
                "Invitation",
                invitation.getId().toString(),
                "Regenerated invitation token and resent invitation to " + invitation.getEmail()
        );

        return toDto(invitation, newRawToken, emailResult);
    }

    @Transactional
    public InvitationDto revokeInvitation(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        Invitation invitation = invitationRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", id));

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new BusinessRuleException("Cannot revoke an invitation that has already been accepted and activated.");
        }

        invitation.setStatus(InvitationStatus.REVOKED);
        invitation = invitationRepository.save(invitation);

        auditService.recordAction(
                orgId,
                currentUser.getId(),
                "EMPLOYEE_INVITATION_REVOKED",
                "Invitation",
                invitation.getId().toString(),
                "Revoked invitation for " + invitation.getEmail()
        );

        return toDto(invitation, null, null);
    }

    @Transactional
    public InvitationValidationDto validateToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return InvitationValidationDto.invalid("Missing invitation token", null);
        }

        String tokenHash = hashToken(rawToken.trim());
        Optional<Invitation> optInv = invitationRepository.findByTokenHash(tokenHash);

        if (optInv.isEmpty()) {
            return InvitationValidationDto.invalid("Invalid or unrecognized invitation link", null);
        }

        Invitation invitation = optInv.get();

        if (invitation.getStatus() == InvitationStatus.REVOKED) {
            return InvitationValidationDto.invalid("This invitation has been revoked by your administrator", InvitationStatus.REVOKED);
        }

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            return InvitationValidationDto.invalid("This invitation has already been accepted and activated. Please log in with your credentials.", InvitationStatus.ACCEPTED);
        }

        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            return InvitationValidationDto.invalid("This invitation has expired. Please contact your HR administrator to request a new invitation.", InvitationStatus.EXPIRED);
        }

        String orgName = organizationRepository.findById(invitation.getOrganizationId())
                .map(Organization::getName)
                .orElse("OnboardAI Workspace");

        return InvitationValidationDto.valid(invitation, orgName);
    }

    @Transactional
    public InvitationDto acceptInvitation(AcceptInvitationRequest request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new BusinessRuleException("Invitation token is required");
        }

        String tokenHash = hashToken(request.getToken().trim());
        Invitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", "Invalid invitation token"));

        if (invitation.getStatus() == InvitationStatus.REVOKED) {
            throw new BusinessRuleException("This invitation has been revoked by your administrator.");
        }

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new BusinessRuleException("This invitation has already been accepted and activated. Please log in.");
        }

        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessRuleException("This invitation has expired. Please contact your HR administrator for a new invitation.");
        }

        // Validate password strength: min 8 chars
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new BusinessRuleException("Password must be at least 8 characters long.");
        }

        String email = invitation.getEmail().toLowerCase().trim();

        // Check if user already exists
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.isActive()) {
            throw new BusinessRuleException("An active user account already exists with this email address.");
        }

        // Create the user account with the immutable role from the invitation record!
        // The employee CANNOT change their assigned role during activation!
        if (user == null) {
            user = new User(
                    invitation.getOrganizationId(),
                    invitation.getFullName(),
                    email,
                    passwordEncoder.encode(request.getPassword()),
                    invitation.getRole()
            );
        } else {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole(invitation.getRole());
            user.setActive(true);
        }
        user = userRepository.save(user);

        // Link Employee record to the activated User account
        final UUID activatedUserId = user.getId();
        if (invitation.getEmployeeId() != null) {
            Optional<Employee> optEmp = employeeRepository.findById(invitation.getEmployeeId());
            if (optEmp.isPresent()) {
                Employee employee = optEmp.get();
                employee.setUserId(activatedUserId);
                employee.setFullName(invitation.getFullName());
                employee.setEmail(email);
                employeeRepository.save(employee);

                // Assign any unlinked tasks to the newly activated user
                taskRepository.findAllByEmployeeId(employee.getId()).forEach(t -> {
                    if (t.getAssignedToUserId() == null) {
                        t.setAssignedToUserId(activatedUserId);
                        taskRepository.save(t);
                    }
                });
            }
        }

        // Mark invitation as ACCEPTED
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(Instant.now());
        invitationRepository.save(invitation);

        auditService.recordAction(
                invitation.getOrganizationId(),
                user.getId(),
                "EMPLOYEE_ACCOUNT_ACTIVATED",
                "User",
                user.getId().toString(),
                "User " + user.getEmail() + " activated their account as " + user.getRole()
        );

        return toDto(invitation, null, null);
    }

    private void preAssignPlan(Employee employee, UUID planId) {
        try {
            OnboardingPlan plan = planRepository.findById(planId).orElse(null);
            if (plan == null) return;

            LocalDate startDate = employee.getEmploymentStartDate() != null ? employee.getEmploymentStartDate() : LocalDate.now();
            List<OnboardingPlanTask> templates = planTaskRepository.findAllByPlanIdOrderByOrderIndexAsc(plan.getId());
            if (templates.isEmpty()) return;

            int maxDays = templates.stream().mapToInt(OnboardingPlanTask::getRelativeDueDays).max().orElse(30);
            LocalDate dueDate = startDate.plusDays(maxDays);

            OnboardingAssignment assignment = new OnboardingAssignment(employee.getOrganizationId(), employee.getId(), plan.getId(), startDate, dueDate);
            assignment = assignmentRepository.save(assignment);

            List<OnboardingTask> tasks = new ArrayList<>();
            for (OnboardingPlanTask tpl : templates) {
                LocalDate taskDueDate = startDate.plusDays(tpl.getRelativeDueDays());
                OnboardingTask task = new OnboardingTask(
                        employee.getOrganizationId(),
                        assignment.getId(),
                        employee.getId(),
                        tpl.getTitle(),
                        tpl.getDescription(),
                        tpl.getCategory(),
                        com.onboardai.tasks.TaskPriority.MEDIUM,
                        employee.getUserId(),
                        taskDueDate,
                        tpl.isRequired(),
                        tpl.isDocumentRequired()
                );
                tasks.add(task);
            }
            taskRepository.saveAll(tasks);
        } catch (Exception ex) {
            log.error("Failed to pre-assign plan to employee {}: {}", employee.getId(), ex.getMessage());
        }
    }

    private void checkAndExpireIfNeeded(Invitation invitation) {
        if (invitation.getStatus() == InvitationStatus.PENDING && invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private InvitationDto toDto(Invitation inv, String rawToken, EmailDeliveryResult emailResult) {
        InvitationDto dto = new InvitationDto();
        dto.setId(inv.getId());
        dto.setOrganizationId(inv.getOrganizationId());
        dto.setEmployeeId(inv.getEmployeeId());
        dto.setFullName(inv.getFullName());
        dto.setEmail(inv.getEmail());
        dto.setPhoneNumber(inv.getPhoneNumber());
        dto.setDepartment(inv.getDepartment());
        dto.setJobTitle(inv.getJobTitle());
        dto.setRole(inv.getRole());
        dto.setEmploymentType(inv.getEmploymentType());
        dto.setStatus(inv.getStatus());
        dto.setExpiresAt(inv.getExpiresAt());
        dto.setAcceptedAt(inv.getAcceptedAt());
        dto.setInvitedByUserId(inv.getInvitedByUserId());
        dto.setCreatedAt(inv.getCreatedAt());

        if (inv.getInvitedByUserId() != null) {
            userRepository.findById(inv.getInvitedByUserId())
                    .ifPresent(u -> dto.setInvitedByName(u.getFullName()));
        }

        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl : "http://localhost:5173";
        String cleanFrontendUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;

        if (rawToken != null) {
            dto.setActivationLink(cleanFrontendUrl + "/invitations/accept?token=" + rawToken);
        }

        if (emailResult != null) {
            dto.setEmailSent(emailResult.isSent());
            dto.setEmailStatus(emailResult.getMessage());
            if (dto.getActivationLink() == null) {
                dto.setActivationLink(emailResult.getActivationLink());
            }
        } else {
            dto.setEmailSent(false);
            dto.setEmailStatus("Existing invitation record");
        }

        return dto;
    }
}
