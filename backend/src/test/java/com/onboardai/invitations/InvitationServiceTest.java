package com.onboardai.invitations;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.mail.EmailDeliveryResult;
import com.onboardai.mail.EmailService;
import com.onboardai.onboarding.*;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.users.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private UserRepository userRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private OnboardingPlanRepository planRepository;
    @Mock private OnboardingPlanTaskRepository planTaskRepository;
    @Mock private OnboardingAssignmentRepository assignmentRepository;
    @Mock private OnboardingTaskRepository taskRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private AuditService auditService;

    private InvitationService invitationService;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    private final UUID orgId = UUID.randomUUID();
    private final UUID hrAdminId = UUID.randomUUID();
    private final UUID hrManagerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        invitationService = new InvitationService(
                invitationRepository,
                employeeRepository,
                userRepository,
                organizationRepository,
                planRepository,
                planTaskRepository,
                assignmentRepository,
                taskRepository,
                passwordEncoder,
                emailService,
                auditService
        );
        mockedSecurityUtils = mockStatic(SecurityUtils.class);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    private void mockCurrentActor(UUID userId, Role role) {
        UserPrincipal principal = new UserPrincipal(userId, orgId, "Actor Name", "actor@acme.com", "pass", role, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(principal);
    }

    @Test
    @DisplayName("HR Admin successfully creates employee record and generates pending invitation")
    void testCreateEmployeeAndInvite_asHrAdmin_success() {
        mockCurrentActor(hrAdminId, Role.HR_ADMIN);

        CreateInvitationRequest request = new CreateInvitationRequest();
        request.setFullName("Jane Newhire");
        request.setEmail("jane.newhire@acme.com");
        request.setPhoneNumber("+1 555-0199");
        request.setDepartment("Engineering");
        request.setJobTitle("Frontend Engineer");
        request.setEmploymentStartDate(LocalDate.now().plusDays(7));
        request.setRole(Role.EMPLOYEE);
        request.setEmploymentType("FULL_TIME");

        when(userRepository.findByEmail("jane.newhire@acme.com")).thenReturn(Optional.empty());
        when(invitationRepository.findByOrganizationIdAndEmailAndStatus(orgId, "jane.newhire@acme.com", InvitationStatus.PENDING))
                .thenReturn(Optional.empty());

        Employee savedEmployee = new Employee(orgId, null, "EMP-101", "Engineering", "Frontend Engineer", null, request.getEmploymentStartDate());
        savedEmployee.setId(UUID.randomUUID());
        when(employeeRepository.save(any(Employee.class))).thenReturn(savedEmployee);

        Invitation savedInvitation = new Invitation(
                orgId,
                savedEmployee.getId(),
                request.getFullName(),
                request.getEmail(),
                request.getPhoneNumber(),
                request.getDepartment(),
                request.getJobTitle(),
                Role.EMPLOYEE,
                "FULL_TIME",
                "dummyhash",
                Instant.now().plus(7, ChronoUnit.DAYS),
                hrAdminId
        );
        savedInvitation.setId(UUID.randomUUID());
        when(invitationRepository.save(any(Invitation.class))).thenReturn(savedInvitation);

        Organization org = new Organization("Acme Corp", "acme.com");
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        when(emailService.sendInvitationEmail(any(), any(), any(), any(), any(), any()))
                .thenReturn(EmailDeliveryResult.success("http://localhost:5173/invitations/accept?token=abc", "Sent"));

        InvitationDto result = invitationService.createEmployeeAndInvite(request);

        assertThat(result).isNotNull();
        assertThat(result.getFullName()).isEqualTo("Jane Newhire");
        assertThat(result.getStatus()).isEqualTo(InvitationStatus.PENDING);
        assertThat(result.getRole()).isEqualTo(Role.EMPLOYEE);
        verify(employeeRepository).save(argThat(e -> e.getUserId() == null)); // Account must NOT have an active user password
        verify(invitationRepository).save(any(Invitation.class));
        verify(emailService).sendInvitationEmail(eq("jane.newhire@acme.com"), eq("Jane Newhire"), eq("Acme Corp"), eq("EMPLOYEE"), any(), any());
    }

    @Test
    @DisplayName("HR Manager cannot invite HR Admin (role hierarchy enforcement)")
    void testCreateEmployeeAndInvite_hrManagerCannotInviteHrAdmin() {
        mockCurrentActor(hrManagerId, Role.HR_MANAGER);

        CreateInvitationRequest request = new CreateInvitationRequest();
        request.setFullName("Super Admin");
        request.setEmail("admin@acme.com");
        request.setDepartment("Executive");
        request.setJobTitle("HR Director");
        request.setEmploymentStartDate(LocalDate.now());
        request.setRole(Role.HR_ADMIN);

        assertThatThrownBy(() -> invitationService.createEmployeeAndInvite(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("HR Managers cannot invite HR Administrators");

        verify(invitationRepository, never()).save(any());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    @DisplayName("HR Manager cannot invite other HR Managers")
    void testCreateEmployeeAndInvite_hrManagerCannotInviteHrManager() {
        mockCurrentActor(hrManagerId, Role.HR_MANAGER);

        CreateInvitationRequest request = new CreateInvitationRequest();
        request.setFullName("Another HR Manager");
        request.setEmail("hrmgr2@acme.com");
        request.setDepartment("HR");
        request.setJobTitle("HR Specialist");
        request.setEmploymentStartDate(LocalDate.now());
        request.setRole(Role.HR_MANAGER);

        assertThatThrownBy(() -> invitationService.createEmployeeAndInvite(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Only HR Admins can assign these roles");
    }

    @Test
    @DisplayName("Creating invitation for existing active user is rejected")
    void testCreateEmployeeAndInvite_duplicateActiveUser_throws() {
        mockCurrentActor(hrAdminId, Role.HR_ADMIN);

        CreateInvitationRequest request = new CreateInvitationRequest();
        request.setFullName("Existing User");
        request.setEmail("existing@acme.com");
        request.setDepartment("Eng");
        request.setJobTitle("Dev");
        request.setEmploymentStartDate(LocalDate.now());

        User existing = new User(orgId, "Existing User", "existing@acme.com", "hash", Role.EMPLOYEE);
        existing.setActive(true);
        when(userRepository.findByEmail("existing@acme.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> invitationService.createEmployeeAndInvite(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Valid token verification returns candidate details and organization branding")
    void testValidateToken_validToken_returnsValidDto() {
        String rawToken = "my-secret-raw-invitation-token-123456789";
        String tokenHash = InvitationService.hashToken(rawToken);

        Invitation invitation = new Invitation(
                orgId,
                UUID.randomUUID(),
                "Alice Wonder",
                "alice@acme.com",
                null,
                "Design",
                "UI Designer",
                Role.EMPLOYEE,
                "FULL_TIME",
                tokenHash,
                Instant.now().plus(5, ChronoUnit.DAYS),
                hrAdminId
        );
        invitation.setId(UUID.randomUUID());

        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(new Organization("Acme Design Studio", "acme.com")));

        InvitationValidationDto validation = invitationService.validateToken(rawToken);

        assertThat(validation.isValid()).isTrue();
        assertThat(validation.getFullName()).isEqualTo("Alice Wonder");
        assertThat(validation.getEmail()).isEqualTo("alice@acme.com");
        assertThat(validation.getOrganizationName()).isEqualTo("Acme Design Studio");
        assertThat(validation.getRole()).isEqualTo(Role.EMPLOYEE);
    }

    @Test
    @DisplayName("Expired token verification returns invalid and auto-updates status to EXPIRED")
    void testValidateToken_expiredToken_marksExpired() {
        String rawToken = "expired-token";
        String tokenHash = InvitationService.hashToken(rawToken);

        Invitation invitation = new Invitation(
                orgId,
                UUID.randomUUID(),
                "Late Person",
                "late@acme.com",
                null,
                "Sales",
                "Account Exec",
                Role.EMPLOYEE,
                "FULL_TIME",
                tokenHash,
                Instant.now().minus(2, ChronoUnit.DAYS), // expired 2 days ago
                hrAdminId
        );

        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));

        InvitationValidationDto validation = invitationService.validateToken(rawToken);

        assertThat(validation.isValid()).isFalse();
        assertThat(validation.getMessage()).contains("expired");
        verify(invitationRepository).save(argThat(i -> i.getStatus() == InvitationStatus.EXPIRED));
    }

    @Test
    @DisplayName("Revoked token verification returns invalid with revoked status")
    void testValidateToken_revokedToken_returnsInvalid() {
        String rawToken = "revoked-token";
        String tokenHash = InvitationService.hashToken(rawToken);

        Invitation invitation = new Invitation();
        invitation.setStatus(InvitationStatus.REVOKED);
        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));

        InvitationValidationDto validation = invitationService.validateToken(rawToken);

        assertThat(validation.isValid()).isFalse();
        assertThat(validation.getMessage()).contains("revoked");
    }

    @Test
    @DisplayName("Already accepted token verification returns invalid with accepted status")
    void testValidateToken_alreadyAccepted_returnsInvalid() {
        String rawToken = "already-used-token";
        String tokenHash = InvitationService.hashToken(rawToken);

        Invitation invitation = new Invitation();
        invitation.setStatus(InvitationStatus.ACCEPTED);
        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));

        InvitationValidationDto validation = invitationService.validateToken(rawToken);

        assertThat(validation.isValid()).isFalse();
        assertThat(validation.getMessage()).contains("already been accepted");
    }

    @Test
    @DisplayName("Accept invitation creates user with immutable role, hashes password, links employee, marks ACCEPTED")
    void testAcceptInvitation_success() {
        String rawToken = "fresh-valid-activation-token";
        String tokenHash = InvitationService.hashToken(rawToken);

        UUID employeeId = UUID.randomUUID();
        Invitation invitation = new Invitation(
                orgId,
                employeeId,
                "New Joiner",
                "newjoiner@acme.com",
                null,
                "Engineering",
                "DevOps Engineer",
                Role.MANAGER, // Assigned role is MANAGER
                "FULL_TIME",
                tokenHash,
                Instant.now().plus(5, ChronoUnit.DAYS),
                hrAdminId
        );
        invitation.setId(UUID.randomUUID());

        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("bcrypt-hashed-pw");
        when(userRepository.findByEmail("newjoiner@acme.com")).thenReturn(Optional.empty());

        User createdUser = new User(orgId, "New Joiner", "newjoiner@acme.com", "bcrypt-hashed-pw", Role.MANAGER);
        createdUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(createdUser);

        Employee emp = new Employee(orgId, null, "EMP-555", "Engineering", "DevOps Engineer", null, LocalDate.now());
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(emp));

        AcceptInvitationRequest request = new AcceptInvitationRequest(rawToken, "SecurePass123!");
        InvitationDto response = invitationService.acceptInvitation(request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);
        // Verify user was created with the assigned role from invitation (cannot be changed by user!)
        verify(userRepository).save(argThat(u -> u.getRole() == Role.MANAGER && u.getEmail().equals("newjoiner@acme.com")));
        // Verify employee record was linked to newly created user ID
        verify(employeeRepository).save(argThat(e -> createdUser.getId().equals(e.getUserId())));
        // Verify invitation status set to ACCEPTED
        verify(invitationRepository).save(argThat(i -> i.getStatus() == InvitationStatus.ACCEPTED && i.getAcceptedAt() != null));
    }

    @Test
    @DisplayName("Accept invitation with short password throws validation error")
    void testAcceptInvitation_shortPassword_throws() {
        String rawToken = "some-token";
        String tokenHash = InvitationService.hashToken(rawToken);

        Invitation invitation = new Invitation(
                orgId, UUID.randomUUID(), "Test", "test@acme.com", null, "Eng", "Dev",
                Role.EMPLOYEE, "FULL_TIME", tokenHash, Instant.now().plus(5, ChronoUnit.DAYS), hrAdminId
        );
        when(invitationRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(invitation));

        AcceptInvitationRequest request = new AcceptInvitationRequest(rawToken, "short");

        assertThatThrownBy(() -> invitationService.acceptInvitation(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("at least 8 characters");
    }

    @Test
    @DisplayName("Resend invitation regenerates token hash, resets expiration, and sends new email")
    void testResendInvitation_success() {
        mockCurrentActor(hrAdminId, Role.HR_ADMIN);

        UUID invId = UUID.randomUUID();
        Invitation invitation = new Invitation(
                orgId, UUID.randomUUID(), "Stale Hire", "stale@acme.com", null, "Ops", "Analyst",
                Role.EMPLOYEE, "FULL_TIME", "oldhash", Instant.now().plus(1, ChronoUnit.DAYS), hrAdminId
        );
        invitation.setId(invId);

        when(invitationRepository.findByIdAndOrganizationId(invId, orgId)).thenReturn(Optional.of(invitation));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(new Organization("Acme Corp", "acme.com")));
        when(emailService.sendInvitationEmail(any(), any(), any(), any(), any(), any()))
                .thenReturn(EmailDeliveryResult.success("http://localhost:5173/invitations/accept?token=new", "Resent"));
        when(invitationRepository.save(any())).thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));

        InvitationDto result = invitationService.resendInvitation(invId);

        assertThat(result).isNotNull();
        assertThat(invitation.getTokenHash()).isNotEqualTo("oldhash");
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.PENDING);
        verify(emailService).sendInvitationEmail(eq("stale@acme.com"), eq("Stale Hire"), eq("Acme Corp"), eq("EMPLOYEE"), any(), any());
    }

    @Test
    @DisplayName("Revoke invitation sets status to REVOKED")
    void testRevokeInvitation_success() {
        mockCurrentActor(hrAdminId, Role.HR_ADMIN);

        UUID invId = UUID.randomUUID();
        Invitation invitation = new Invitation(
                orgId, UUID.randomUUID(), "Revoke Me", "revoke@acme.com", null, "Ops", "Analyst",
                Role.EMPLOYEE, "FULL_TIME", "tokenhash", Instant.now().plus(5, ChronoUnit.DAYS), hrAdminId
        );
        invitation.setId(invId);

        when(invitationRepository.findByIdAndOrganizationId(invId, orgId)).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(invocationOnMock -> invocationOnMock.getArgument(0));

        InvitationDto result = invitationService.revokeInvitation(invId);

        assertThat(result.getStatus()).isEqualTo(InvitationStatus.REVOKED);
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.REVOKED);
    }
}
