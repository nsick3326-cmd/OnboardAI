package com.onboardai.tasks;

import com.onboardai.audit.AuditService;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.onboarding.OnboardingAssignment;
import com.onboardai.onboarding.OnboardingAssignmentRepository;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskProgressTest {

    @Mock
    private OnboardingTaskRepository taskRepository;

    @Mock
    private OnboardingAssignmentRepository assignmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TaskService taskService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private UUID orgId;
    private UUID userId;
    private UUID employeeId;
    private UUID assignmentId;
    private OnboardingTask task;
    private OnboardingAssignment assignment;
    private Employee employee;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        assignmentId = UUID.randomUUID();

        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

        UserPrincipal hrPrincipal = new UserPrincipal(userId, orgId, "HR Lead", "hr@acme.com", "pass", Role.HR_ADMIN, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(hrPrincipal);

        task = new OnboardingTask(orgId, assignmentId, employeeId, "Submit Tax Info", "Desc",
                TaskCategory.DOCUMENTATION, TaskPriority.HIGH, userId, LocalDate.now().plusDays(2), true, true);
        task.setId(UUID.randomUUID());

        assignment = new OnboardingAssignment(orgId, employeeId, UUID.randomUUID(), LocalDate.now(), LocalDate.now().plusDays(30));
        assignment.setId(assignmentId);

        employee = new Employee(orgId, userId, "EMP-300", "Engineering", "Engineer", null, LocalDate.now());
        employee.setId(employeeId);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    @DisplayName("Updating task status to COMPLETED recalculates progress percentage to 100% when all tasks done")
    void testProgressCalculationComplete() {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(TaskStatus.COMPLETED, "Done");

        when(taskRepository.findByIdAndOrganizationId(task.getId(), orgId)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(OnboardingTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 2 total required, 2 completed
        when(taskRepository.countByAssignmentIdAndRequiredTrue(assignmentId)).thenReturn(2L);
        when(taskRepository.countByAssignmentIdAndRequiredTrueAndStatus(assignmentId, TaskStatus.COMPLETED)).thenReturn(2L);
        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        TaskDto result = taskService.updateTaskStatus(task.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(result.getCompletedAt()).isNotNull();

        assertThat(assignment.getCompletionPercentage()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(assignment.getStatus()).isEqualTo(OnboardingStatus.COMPLETED);
        assertThat(employee.getOnboardingStatus()).isEqualTo(OnboardingStatus.COMPLETED);

        verify(assignmentRepository).save(assignment);
        verify(employeeRepository).save(employee);
    }

    @Test
    @DisplayName("Partial completion sets completion percentage proportionally without completing onboarding")
    void testProgressCalculationPartial() {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(TaskStatus.COMPLETED, "Step 1 done");

        when(taskRepository.findByIdAndOrganizationId(task.getId(), orgId)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(OnboardingTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 4 total required, 1 completed -> 25.00%
        when(taskRepository.countByAssignmentIdAndRequiredTrue(assignmentId)).thenReturn(4L);
        when(taskRepository.countByAssignmentIdAndRequiredTrueAndStatus(assignmentId, TaskStatus.COMPLETED)).thenReturn(1L);
        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        TaskDto result = taskService.updateTaskStatus(task.getId(), request);

        assertThat(result.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(assignment.getCompletionPercentage()).isEqualByComparingTo(BigDecimal.valueOf(25.00));
        assertThat(assignment.getStatus()).isEqualTo(OnboardingStatus.IN_PROGRESS);
    }
}
