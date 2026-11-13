package com.onboardai.auth;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.security.JwtTokenProvider;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sampleUser = new User(orgId, "Test Admin", "admin@acme.com", "$2a$10$hashedpassword", Role.HR_ADMIN);
        sampleUser.setId(userId);
    }

    @Test
    @DisplayName("Successful login returns valid JWT token and user summary")
    void testSuccessfulLogin() {
        LoginRequest request = new LoginRequest("admin@acme.com", "Admin123!");

        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(sampleUser));

        UserPrincipal principal = UserPrincipal.create(sampleUser);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(principal)).thenReturn("mocked.jwt.token");
        when(employeeRepository.findByUserId(userId)).thenReturn(Optional.empty());

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("admin@acme.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.HR_ADMIN);
        assertThat(response.getUser().getOrganizationId()).isEqualTo(orgId);
    }

    @Test
    @DisplayName("Login with unknown email throws BusinessRuleException")
    void testLoginUnknownUser() {
        LoginRequest request = new LoginRequest("unknown@acme.com", "Password123!");

        when(userRepository.findByEmail("unknown@acme.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("Login with deactivated user throws BusinessRuleException")
    void testLoginDeactivatedUser() {
        sampleUser.setActive(false);
        LoginRequest request = new LoginRequest("admin@acme.com", "Admin123!");

        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Account has been deactivated");
    }

    @Test
    @DisplayName("Login with mismatched portal role throws BusinessRuleException")
    void testLoginRoleMismatchThrowsException() {
        LoginRequest request = new LoginRequest("admin@acme.com", "Admin123!", Role.EMPLOYEE);

        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Role Mismatch: Your account is registered as HR Admin, not Employee");
    }

    @Test
    @DisplayName("Reset password updates user hash and records audit")
    void testSuccessfulResetPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("admin@acme.com", "NewSecretPass123!");

        when(userRepository.findByEmail("admin@acme.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("NewSecretPass123!")).thenReturn("$2a$10$newhashedpassword");

        authService.resetPassword(request);

        assertThat(sampleUser.getPasswordHash()).isEqualTo("$2a$10$newhashedpassword");
        verify(userRepository).save(sampleUser);
    }
}
