package com.onboardai.security;

import com.onboardai.common.UnauthorizedException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.EmployeeService;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.users.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantIsolationTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private UUID orgA;
    private UUID orgB;
    private UUID userOrgA;

    @BeforeEach
    void setUp() {
        orgA = UUID.randomUUID();
        orgB = UUID.randomUUID();
        userOrgA = UUID.randomUUID();

        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgA);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userOrgA);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    @DisplayName("Employee from Organization A cannot access employee record belonging to Organization B")
    void testCrossOrganizationAccessBlocked() {
        UUID employeeIdOrgB = UUID.randomUUID();

        // Repository filters by orgA, so an entity from orgB returns empty
        when(employeeRepository.findByIdAndOrganizationId(employeeIdOrgB, orgA)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.getEmployeeById(employeeIdOrgB))
                .isInstanceOf(com.onboardai.common.ResourceNotFoundException.class)
                .hasMessageContaining("Employee not found");

        verify(employeeRepository).findByIdAndOrganizationId(employeeIdOrgB, orgA);
    }

    @Test
    @DisplayName("Employee cannot access another employee's profile within the same organization")
    void testEmployeeSelfAccessIsolation() {
        UUID otherUserId = UUID.randomUUID();
        Employee otherEmp = new Employee(orgA, otherUserId, "EMP-200", "Sales", "Rep", null, LocalDate.now());
        otherEmp.setId(UUID.randomUUID());

        UserPrincipal employeePrincipal = new UserPrincipal(userOrgA, orgA, "Test Employee", "emp@acme.com", "pass", Role.EMPLOYEE, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(employeePrincipal);

        when(employeeRepository.findByIdAndOrganizationId(otherEmp.getId(), orgA)).thenReturn(Optional.of(otherEmp));

        assertThatThrownBy(() -> employeeService.getEmployeeById(otherEmp.getId()))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("You are only permitted to view your own employee record");
    }
}
