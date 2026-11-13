package com.onboardai.onboarding;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.notifications.NotificationService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.*;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingWorkflowTest {

    @Mock
    private OnboardingPlanRepository planRepository;

    @Mock
    private OnboardingPlanTaskRepository planTaskRepository;

    @Mock
    private OnboardingAssignmentRepository assignmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private OnboardingTaskRepository taskRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OnboardingPlanService planService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private UUID orgId;
    private UUID userId;
    private Employee sampleEmployee;
    private OnboardingPlan samplePlan;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

        UserPrincipal principal = new UserPrincipal(userId, orgId, "Admin", "admin@acme.com", "pass", Role.HR_ADMIN, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(principal);

        sampleEmployee = new Employee(orgId, userId, "EMP-100", "Engineering", "Developer", null, LocalDate.now());
        sampleEmployee.setId(UUID.randomUUID());

        samplePlan = new OnboardingPlan(orgId, "Engineering Plan", "Description", "Developer", "Engineering", userId);
        samplePlan.setId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    @DisplayName("Assigning a plan creates assignment and auto-generates concrete tasks")
    void testAssignPlanToEmployee() {
        AssignPlanRequest request = new AssignPlanRequest(sampleEmployee.getId(), LocalDate.now());

        when(employeeRepository.findByIdAndOrganizationId(sampleEmployee.getId(), orgId)).thenReturn(Optional.of(sampleEmployee));
        when(planRepository.findByIdAndOrganizationId(samplePlan.getId(), orgId)).thenReturn(Optional.of(samplePlan));
        when(assignmentRepository.existsByEmployeeId(sampleEmployee.getId())).thenReturn(false);

        OnboardingPlanTask taskTpl1 = new OnboardingPlanTask("Task 1", "Desc", TaskCategory.DOCUMENTATION, 2, true, "EMPLOYEE", true, 0);
        OnboardingPlanTask taskTpl2 = new OnboardingPlanTask("Task 2", "Desc", TaskCategory.IT_SETUP, 5, true, "EMPLOYEE", false, 1);
        when(planTaskRepository.findAllByPlanIdOrderByOrderIndexAsc(samplePlan.getId())).thenReturn(List.of(taskTpl1, taskTpl2));

        OnboardingAssignment savedAssignment = new OnboardingAssignment(orgId, sampleEmployee.getId(), samplePlan.getId(), LocalDate.now(), LocalDate.now().plusDays(5));
        savedAssignment.setId(UUID.randomUUID());
        when(assignmentRepository.save(any(OnboardingAssignment.class))).thenReturn(savedAssignment);

        OnboardingAssignmentDto result = planService.assignPlanToEmployee(samplePlan.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.getEmployeeName()).isEqualTo("EMP-100");
        assertThat(result.getTotalTasks()).isEqualTo(2);

        verify(taskRepository).saveAll(anyList());
        verify(employeeRepository).save(sampleEmployee);
        assertThat(sampleEmployee.getOnboardingStatus()).isEqualTo(OnboardingStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("Assigning plan to an employee who already has an active plan throws BusinessRuleException")
    void testDuplicatePlanAssignmentBlocked() {
        AssignPlanRequest request = new AssignPlanRequest(sampleEmployee.getId(), LocalDate.now());

        when(employeeRepository.findByIdAndOrganizationId(sampleEmployee.getId(), orgId)).thenReturn(Optional.of(sampleEmployee));
        when(planRepository.findByIdAndOrganizationId(samplePlan.getId(), orgId)).thenReturn(Optional.of(samplePlan));
        when(assignmentRepository.existsByEmployeeId(sampleEmployee.getId())).thenReturn(true);

        assertThatThrownBy(() -> planService.assignPlanToEmployee(samplePlan.getId(), request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already has an active onboarding assignment");
    }
}
