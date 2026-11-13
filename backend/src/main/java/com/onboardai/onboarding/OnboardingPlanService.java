package com.onboardai.onboarding;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.notifications.NotificationService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.tasks.OnboardingTask;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.tasks.TaskPriority;
import com.onboardai.tasks.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OnboardingPlanService {

    private final OnboardingPlanRepository planRepository;
    private final OnboardingPlanTaskRepository planTaskRepository;
    private final OnboardingAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository taskRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public OnboardingPlanService(
            OnboardingPlanRepository planRepository,
            OnboardingPlanTaskRepository planTaskRepository,
            OnboardingAssignmentRepository assignmentRepository,
            EmployeeRepository employeeRepository,
            OnboardingTaskRepository taskRepository,
            NotificationService notificationService,
            AuditService auditService) {
        this.planRepository = planRepository;
        this.planTaskRepository = planTaskRepository;
        this.assignmentRepository = assignmentRepository;
        this.employeeRepository = employeeRepository;
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<OnboardingPlanDto> getPlans(Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        return planRepository.findAllByOrganizationId(orgId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<OnboardingPlanDto> getActivePlans() {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        return planRepository.findAllByOrganizationIdAndActiveTrue(orgId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public OnboardingPlanDto getPlanById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        OnboardingPlan plan = planRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("OnboardingPlan", "id", id));
        return toDto(plan);
    }

    @Transactional
    public OnboardingPlanDto createPlan(CreatePlanRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        if (planRepository.existsByOrganizationIdAndName(orgId, request.getName().trim())) {
            throw new BusinessRuleException("An onboarding plan with name '" + request.getName() + "' already exists");
        }

        OnboardingPlan plan = new OnboardingPlan(
                orgId,
                request.getName().trim(),
                request.getDescription(),
                request.getTargetRole(),
                request.getDepartment(),
                userId
        );

        int index = 0;
        for (CreatePlanRequest.PlanTaskTemplateDto taskDto : request.getTasks()) {
            OnboardingPlanTask planTask = new OnboardingPlanTask(
                    taskDto.getTitle().trim(),
                    taskDto.getDescription(),
                    taskDto.getCategory(),
                    taskDto.getRelativeDueDays(),
                    taskDto.isRequired(),
                    taskDto.getResponsibleRole(),
                    taskDto.isDocumentRequired(),
                    index++
            );
            plan.addTask(planTask);
        }

        OnboardingPlan saved = planRepository.save(plan);

        auditService.recordAction(orgId, userId, "CREATE_PLAN", "OnboardingPlan", saved.getId().toString(),
                "Created plan: " + saved.getName() + " with " + saved.getTasks().size() + " templates");

        return toDto(saved);
    }

    @Transactional
    public OnboardingAssignmentDto assignPlanToEmployee(UUID planId, AssignPlanRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(request.getEmployeeId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        OnboardingPlan plan = planRepository.findByIdAndOrganizationId(planId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("OnboardingPlan", "id", planId));

        if (assignmentRepository.existsByEmployeeId(employee.getId())) {
            throw new BusinessRuleException("Employee already has an active onboarding assignment");
        }

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : employee.getEmploymentStartDate();
        if (startDate == null) {
            startDate = LocalDate.now();
        }

        List<OnboardingPlanTask> templates = planTaskRepository.findAllByPlanIdOrderByOrderIndexAsc(plan.getId());
        if (templates.isEmpty()) {
            throw new BusinessRuleException("Cannot assign a plan with no task templates");
        }

        int maxDays = templates.stream().mapToInt(OnboardingPlanTask::getRelativeDueDays).max().orElse(30);
        LocalDate dueDate = startDate.plusDays(maxDays);

        OnboardingAssignment assignment = new OnboardingAssignment(orgId, employee.getId(), plan.getId(), startDate, dueDate);
        assignment = assignmentRepository.save(assignment);

        List<OnboardingTask> tasksToCreate = new ArrayList<>();
        for (OnboardingPlanTask tpl : templates) {
            LocalDate taskDueDate = startDate.plusDays(tpl.getRelativeDueDays());
            UUID assignedUser = "EMPLOYEE".equalsIgnoreCase(tpl.getResponsibleRole()) ? employee.getUserId() : null;

            OnboardingTask task = new OnboardingTask(
                    orgId,
                    assignment.getId(),
                    employee.getId(),
                    tpl.getTitle(),
                    tpl.getDescription(),
                    tpl.getCategory(),
                    TaskPriority.MEDIUM,
                    assignedUser,
                    taskDueDate,
                    tpl.isRequired(),
                    tpl.isDocumentRequired()
            );
            tasksToCreate.add(task);
        }
        taskRepository.saveAll(tasksToCreate);

        employee.setOnboardingStatus(OnboardingStatus.IN_PROGRESS);
        employeeRepository.save(employee);

        if (employee.getUserId() != null) {
            notificationService.createNotification(
                    orgId,
                    employee.getUserId(),
                    "Onboarding Plan Activated",
                    "Your onboarding plan '" + plan.getName() + "' is ready with " + tasksToCreate.size() + " tasks.",
                    "ONBOARDING",
                    "/dashboard/tasks"
            );
        }

        auditService.recordAction(orgId, actorUserId, "ASSIGN_PLAN", "OnboardingAssignment", assignment.getId().toString(),
                "Assigned plan '" + plan.getName() + "' to employee: " + employee.getEmployeeCode());

        return toAssignmentDto(assignment, plan.getName(), employee.getEmployeeCode(), tasksToCreate.size(), 0);
    }

    @Transactional(readOnly = true)
    public OnboardingAssignmentDto getEmployeeAssignment(UUID employeeId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Employee employee = employeeRepository.findByIdAndOrganizationId(employeeId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        OnboardingAssignment assignment = assignmentRepository.findByEmployeeId(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No active onboarding assignment for employee: " + employeeId));

        OnboardingPlan plan = planRepository.findById(assignment.getPlanId()).orElse(null);
        String planName = plan != null ? plan.getName() : "Custom Plan";

        long total = taskRepository.countByEmployeeId(employee.getId());
        long completed = taskRepository.countByEmployeeIdAndStatus(employee.getId(), TaskStatus.COMPLETED);

        return toAssignmentDto(assignment, planName, employee.getEmployeeCode(), (int) total, (int) completed);
    }

    private OnboardingPlanDto toDto(OnboardingPlan plan) {
        OnboardingPlanDto dto = new OnboardingPlanDto();
        dto.setId(plan.getId());
        dto.setOrganizationId(plan.getOrganizationId());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setTargetRole(plan.getTargetRole());
        dto.setDepartment(plan.getDepartment());
        dto.setActive(plan.isActive());
        dto.setTaskCount(plan.getTasks() != null ? plan.getTasks().size() : 0);
        dto.setTasks(plan.getTasks());
        dto.setCreatedAt(plan.getCreatedAt());
        return dto;
    }

    private OnboardingAssignmentDto toAssignmentDto(OnboardingAssignment assignment, String planName, String empName, int total, int completed) {
        OnboardingAssignmentDto dto = new OnboardingAssignmentDto();
        dto.setId(assignment.getId());
        dto.setOrganizationId(assignment.getOrganizationId());
        dto.setEmployeeId(assignment.getEmployeeId());
        dto.setEmployeeName(empName);
        dto.setPlanId(assignment.getPlanId());
        dto.setPlanName(planName);
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setStartDate(assignment.getStartDate());
        dto.setDueDate(assignment.getDueDate());
        dto.setStatus(assignment.getStatus());
        dto.setCompletionPercentage(assignment.getCompletionPercentage());
        dto.setTotalTasks(total);
        dto.setCompletedTasks(completed);
        return dto;
    }
}
