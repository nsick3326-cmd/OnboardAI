package com.onboardai.tasks;

import com.onboardai.audit.AuditService;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.onboarding.OnboardingAssignment;
import com.onboardai.onboarding.OnboardingAssignmentRepository;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaskService {

    private final OnboardingTaskRepository taskRepository;
    private final OnboardingAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public TaskService(
            OnboardingTaskRepository taskRepository,
            OnboardingAssignmentRepository assignmentRepository,
            EmployeeRepository employeeRepository,
            AuditService auditService) {
        this.taskRepository = taskRepository;
        this.assignmentRepository = assignmentRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<TaskDto> getTasks(UUID employeeId, TaskCategory category, TaskStatus status, Boolean overdue, Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        UUID filterEmployeeId = employeeId;
        UUID filterAssignedUserId = null;

        if (currentUser.getRole() == Role.EMPLOYEE) {
            Optional<Employee> empOpt = employeeRepository.findByUserId(currentUser.getId());
            if (empOpt.isEmpty()) {
                return Page.empty(pageable);
            }
            filterEmployeeId = empOpt.get().getId();
        } else if (currentUser.getRole() == Role.MANAGER) {
            Optional<Employee> mgrEmp = employeeRepository.findByUserId(currentUser.getId());
            if (filterEmployeeId != null) {
                // Verify this employee reports to this manager
                final UUID targetEmpId = filterEmployeeId;
                Employee emp = employeeRepository.findByIdAndOrganizationId(targetEmpId, orgId)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", targetEmpId));
                if (mgrEmp.isEmpty() || !mgrEmp.get().getId().equals(emp.getManagerId())) {
                    throw new UnauthorizedException("You are not authorized to view tasks for this employee");
                }
            }
        }

        return taskRepository.filterTasks(orgId, filterEmployeeId, filterAssignedUserId, category, status, overdue, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public TaskDto getTaskById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        OnboardingTask task = taskRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("OnboardingTask", "id", id));
        validateTaskAccess(task);
        return toDto(task);
    }

    @Transactional
    public TaskDto updateTaskStatus(UUID id, UpdateTaskStatusRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        OnboardingTask task = taskRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("OnboardingTask", "id", id));

        validateTaskAccess(task);

        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.getStatus();

        task.setStatus(newStatus);
        if (request.getComments() != null && !request.getComments().isBlank()) {
            task.setComments(request.getComments().trim());
        }

        if (newStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(Instant.now());
        } else if (oldStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }

        task = taskRepository.save(task);

        // Recalculate progress for the assignment
        recalculateProgress(task.getAssignmentId(), task.getEmployeeId());

        auditService.recordAction(orgId, userId, "UPDATE_TASK_STATUS", "OnboardingTask", task.getId().toString(),
                "Status changed from " + oldStatus + " to " + newStatus);

        return toDto(task);
    }

    @Transactional
    public TaskDto createTask(CreateTaskRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(request.getEmployeeId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        OnboardingAssignment assignment = assignmentRepository.findByEmployeeId(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No active onboarding assignment for employee: " + employee.getId()));

        OnboardingTask task = new OnboardingTask(
                orgId,
                assignment.getId(),
                employee.getId(),
                request.getTitle().trim(),
                request.getDescription(),
                request.getCategory() != null ? request.getCategory() : TaskCategory.GENERAL,
                request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM,
                employee.getUserId(),
                request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(7),
                request.isRequired(),
                request.isDocumentRequired()
        );

        task = taskRepository.save(task);
        recalculateProgress(assignment.getId(), employee.getId());

        auditService.recordAction(orgId, actorUserId, "CREATE_TASK", "OnboardingTask", task.getId().toString(),
                "Added task: " + task.getTitle() + " for employee " + employee.getEmployeeCode());

        return toDto(task);
    }

    private void recalculateProgress(UUID assignmentId, UUID employeeId) {
        long totalRequired = taskRepository.countByAssignmentIdAndRequiredTrue(assignmentId);
        long completedRequired = taskRepository.countByAssignmentIdAndRequiredTrueAndStatus(assignmentId, TaskStatus.COMPLETED);

        BigDecimal percentage = BigDecimal.ZERO;
        if (totalRequired > 0) {
            percentage = BigDecimal.valueOf((completedRequired * 100.0) / totalRequired)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            percentage = BigDecimal.valueOf(100.00);
        }

        Optional<OnboardingAssignment> assignOpt = assignmentRepository.findById(assignmentId);
        if (assignOpt.isPresent()) {
            OnboardingAssignment assignment = assignOpt.get();
            assignment.setCompletionPercentage(percentage);

            Optional<Employee> empOpt = employeeRepository.findById(employeeId);
            if (percentage.compareTo(BigDecimal.valueOf(100.00)) >= 0) {
                assignment.setStatus(OnboardingStatus.COMPLETED);
                empOpt.ifPresent(e -> {
                    e.setOnboardingStatus(OnboardingStatus.COMPLETED);
                    employeeRepository.save(e);
                });
            } else {
                assignment.setStatus(OnboardingStatus.IN_PROGRESS);
                empOpt.ifPresent(e -> {
                    if (e.getOnboardingStatus() != OnboardingStatus.BLOCKED) {
                        e.setOnboardingStatus(OnboardingStatus.IN_PROGRESS);
                        employeeRepository.save(e);
                    }
                });
            }
            assignmentRepository.save(assignment);
        }
    }

    private void validateTaskAccess(OnboardingTask task) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.getRole() == Role.HR_ADMIN || currentUser.getRole() == Role.HR_MANAGER) {
            return;
        }

        if (currentUser.getRole() == Role.EMPLOYEE) {
            Optional<Employee> emp = employeeRepository.findByUserId(currentUser.getId());
            if (emp.isEmpty() || !emp.get().getId().equals(task.getEmployeeId())) {
                throw new UnauthorizedException("You are not authorized to view or modify this task");
            }
            return;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Optional<Employee> mgr = employeeRepository.findByUserId(currentUser.getId());
            Optional<Employee> emp = employeeRepository.findById(task.getEmployeeId());
            if (mgr.isEmpty() || emp.isEmpty() || !mgr.get().getId().equals(emp.get().getManagerId())) {
                throw new UnauthorizedException("You are not authorized to access tasks for non-supervised employees");
            }
        }
    }

    private TaskDto toDto(OnboardingTask task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setOrganizationId(task.getOrganizationId());
        dto.setAssignmentId(task.getAssignmentId());
        dto.setEmployeeId(task.getEmployeeId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setCategory(task.getCategory());
        dto.setPriority(task.getPriority());
        dto.setAssignedToUserId(task.getAssignedToUserId());
        dto.setDueDate(task.getDueDate());
        dto.setStatus(task.getStatus());
        dto.setRequired(task.isRequired());
        dto.setDocumentRequired(task.isDocumentRequired());
        dto.setCompletedAt(task.getCompletedAt());
        dto.setComments(task.getComments());
        dto.setCreatedAt(task.getCreatedAt());

        boolean isOverdue = task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != TaskStatus.COMPLETED;
        dto.setOverdue(isOverdue);

        employeeRepository.findById(task.getEmployeeId()).ifPresent(emp -> {
            dto.setEmployeeName(emp.getEmployeeCode());
        });

        return dto;
    }
}
