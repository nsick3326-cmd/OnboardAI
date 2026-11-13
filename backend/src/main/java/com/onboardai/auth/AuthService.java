package com.onboardai.auth;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.security.JwtTokenProvider;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.onboardai.common.UnauthorizedException;
import com.onboardai.users.Organization;
import com.onboardai.users.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.setup.secret-key:OnboardAI-Admin-Setup-Secret-2026}")
    private String setupSecretKey;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BusinessRuleException("Invalid email or password"));

        if (!user.isActive()) {
            throw new BusinessRuleException("Account has been deactivated. Please contact HR administration.");
        }

        // Validate selected portal role matches authenticated backend account role
        if (request.getSelectedRole() != null && user.getRole() != request.getSelectedRole()) {
            throw new BusinessRuleException(String.format(
                    "Role Mismatch: Your account is registered as %s, not %s. Please select the %s portal to continue.",
                    formatRoleName(user.getRole()),
                    formatRoleName(request.getSelectedRole()),
                    formatRoleName(user.getRole())
            ));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String token = tokenProvider.generateToken(principal);

        UUID employeeId = employeeRepository.findByUserId(user.getId())
                .map(Employee::getId)
                .orElse(null);

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getOrganizationId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                employeeId
        );

        return new AuthResponse(token, userSummary);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BusinessRuleException("No registered account found with email: " + request.getEmail()));

        if (!user.isActive()) {
            throw new BusinessRuleException("Account has been deactivated. Please contact HR administration.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.recordAction(
                user.getOrganizationId(),
                user.getId(),
                "SECURITY_PASSWORD_RESET",
                "User",
                user.getId().toString(),
                "User password was reset via self-service verification."
        );
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser() {
        UserPrincipal principal = SecurityUtils.getCurrentUser();
        UUID employeeId = employeeRepository.findByUserId(principal.getId())
                .map(Employee::getId)
                .orElse(null);

        return new UserSummaryDto(
                principal.getId(),
                principal.getOrganizationId(),
                principal.getFullName(),
                principal.getUsername(),
                principal.getRole(),
                employeeId
        );
    }

    private String formatRoleName(Role role) {
        if (role == null) return "Unknown";
        return switch (role) {
            case HR_ADMIN -> "HR Admin";
            case HR_MANAGER -> "HR Manager";
            case MANAGER -> "Team Manager";
            case EMPLOYEE -> "Employee";
        };
    }

    @Transactional(readOnly = true)
    public SetupStatusResponse getSetupStatus() {
        long userCount = userRepository.count();
        long orgCount = organizationRepository.count();
        boolean allowed = userCount == 0;
        String message = allowed
                ? "Initial organization setup is enabled. No administrator accounts exist yet."
                : "Initial organization setup is locked. Organization and administrator accounts are already established.";
        return new SetupStatusResponse(allowed, userCount, orgCount, message);
    }

    @Transactional
    public SetupWorkspaceResponse setupWorkspace(SetupWorkspaceRequest request) {
        long userCount = userRepository.count();

        // If users already exist, initial public setup is locked!
        // It requires the authorized setup key or fails with 403 Forbidden.
        if (userCount > 0) {
            if (request.getSetupKey() == null || !request.getSetupKey().equals(setupSecretKey)) {
                throw new UnauthorizedException("Unauthorized: Company workspace setup is locked because an organization administrator already exists. A valid setup key is required.");
            }
        }

        String email = request.getAdminEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessRuleException("A user account with email '" + email + "' already exists.");
        }

        // Create organization
        Organization org = new Organization(request.getOrganizationName().trim(), request.getDomain());
        org = organizationRepository.save(org);

        // Create initial HR Administrator
        User adminUser = new User(
                org.getId(),
                request.getAdminFullName().trim(),
                email,
                passwordEncoder.encode(request.getAdminPassword()),
                Role.HR_ADMIN
        );
        adminUser.setActive(true);
        adminUser = userRepository.save(adminUser);

        // Create Employee profile for HR Administrator
        Employee adminEmp = new Employee(
                org.getId(),
                adminUser.getId(),
                "ADMIN-001",
                adminUser.getFullName(),
                adminUser.getEmail(),
                null,
                "FULL_TIME",
                "Human Resources",
                "HR Director / Administrator",
                null,
                LocalDate.now()
        );
        employeeRepository.save(adminEmp);

        // Generate token for immediate authentication
        UserPrincipal principal = UserPrincipal.create(adminUser);
        String token = tokenProvider.generateToken(principal);

        auditService.recordAction(
                org.getId(),
                adminUser.getId(),
                "ORGANIZATION_WORKSPACE_SETUP",
                "Organization",
                org.getId().toString(),
                "Initial workspace setup completed for '" + org.getName() + "' by administrator " + adminUser.getEmail()
        );

        return new SetupWorkspaceResponse(
                org.getId(),
                org.getName(),
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getEmail(),
                token,
                "Company workspace successfully initialized!"
        );
    }
}
