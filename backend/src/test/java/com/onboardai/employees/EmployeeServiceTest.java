package com.onboardai.employees;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.onboarding.OnboardingAssignmentRepository;
import com.onboardai.onboarding.OnboardingPlanService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OnboardingAssignmentRepository assignmentRepository;

    @Mock
    private OnboardingPlanService planService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EmployeeService employeeService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

        UserPrincipal adminPrincipal = new UserPrincipal(userId, orgId, "Admin", "admin@acme.com", "pass", Role.HR_ADMIN, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(adminPrincipal);
        mockedSecurityUtils.when(SecurityUtils::isHr).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    @DisplayName("Create employee successfully saves user, employee, and audits action")
    void testCreateEmployeeSuccess() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setFullName("Alice Johnson");
        request.setEmail("alice@acme.com");
        request.setEmployeeCode("EMP-999");
        request.setDepartment("Engineering");
        request.setJobTitle("Backend Engineer");
        request.setEmploymentStartDate(LocalDate.now());

        when(employeeRepository.existsByOrganizationIdAndEmployeeCode(orgId, "EMP-999")).thenReturn(false);
        when(userRepository.findByEmail("alice@acme.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed-pass");

        User newUser = new User(orgId, "Alice Johnson", "alice@acme.com", "hashed-pass", Role.EMPLOYEE);
        newUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(newUser);

        Employee saved = new Employee(orgId, newUser.getId(), "EMP-999", "Engineering", "Backend Engineer", null, LocalDate.now());
        saved.setId(UUID.randomUUID());
        when(employeeRepository.save(any(Employee.class))).thenReturn(saved);

        EmployeeDto response = employeeService.createEmployee(request);

        assertThat(response).isNotNull();
        assertThat(response.getEmployeeCode()).isEqualTo("EMP-999");
        assertThat(response.getDepartment()).isEqualTo("Engineering");
        verify(employeeRepository).save(any(Employee.class));
        verify(auditService).recordAction(eq(orgId), eq(userId), eq("CREATE_EMPLOYEE"), eq("Employee"), eq(saved.getId().toString()), any());
    }

    @Test
    @DisplayName("Create employee with duplicate employee code throws BusinessRuleException")
    void testCreateEmployeeDuplicateCodeThrows() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setFullName("Duplicate Person");
        request.setEmail("dup@acme.com");
        request.setEmployeeCode("EMP-001");
        request.setDepartment("Engineering");
        request.setJobTitle("Backend Engineer");
        request.setEmploymentStartDate(LocalDate.now());

        when(employeeRepository.existsByOrganizationIdAndEmployeeCode(orgId, "EMP-001")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.createEmployee(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already exists in this organization");

        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("Get employees returns paginated results scoped to current tenant organization")
    void testGetEmployeesPaginated() {
        Employee emp = new Employee(orgId, null, "EMP-001", "Design", "Product Designer", null, LocalDate.now());
        emp.setId(UUID.randomUUID());
        Page<Employee> page = new PageImpl<>(Collections.singletonList(emp));

        Pageable pageable = PageRequest.of(0, 10);
        when(employeeRepository.searchEmployees(eq(orgId), any(), any(), any(), any(), eq(pageable))).thenReturn(page);

        Page<EmployeeDto> response = employeeService.getEmployees(null, null, null, null, pageable);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getEmployeeCode()).isEqualTo("EMP-001");
        assertThat(response.getTotalElements()).isEqualTo(1);
    }
}
