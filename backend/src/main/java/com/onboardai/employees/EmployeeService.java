package com.onboardai.employees;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.onboarding.AssignPlanRequest;
import com.onboardai.onboarding.OnboardingAssignment;
import com.onboardai.onboarding.OnboardingAssignmentRepository;
import com.onboardai.onboarding.OnboardingPlanService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final OnboardingAssignmentRepository assignmentRepository;
    private final OnboardingPlanService planService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            OnboardingAssignmentRepository assignmentRepository,
            @Lazy OnboardingPlanService planService,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.planService = planService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDto> getEmployees(String department, OnboardingStatus status, UUID managerId, String search, Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        UUID filterManagerId = managerId;
        if (currentUser.getRole() == Role.MANAGER) {
            Optional<Employee> currentEmp = employeeRepository.findByUserId(currentUser.getId());
            if (currentEmp.isEmpty()) {
                return Page.empty(pageable);
            }
            filterManagerId = currentEmp.get().getId();
        }

        return employeeRepository.searchEmployees(orgId, department, status, filterManagerId, search, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Employee employee = employeeRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        validateEmployeeAccess(employee);
        return toDto(employee);
    }

    @Transactional
    public EmployeeDto createEmployee(CreateEmployeeRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        if (employeeRepository.existsByOrganizationIdAndEmployeeCode(orgId, request.getEmployeeCode().trim())) {
            throw new BusinessRuleException("Employee with code '" + request.getEmployeeCode() + "' already exists in this organization");
        }

        // Create or link user account
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String rawPassword = request.getTemporaryPassword() != null && !request.getTemporaryPassword().isBlank()
                    ? request.getTemporaryPassword()
                    : "Employee123!";
            user = new User(orgId, request.getFullName().trim(), email, passwordEncoder.encode(rawPassword), Role.EMPLOYEE);
            user = userRepository.save(user);
        }

        Employee employee = new Employee(
                orgId,
                user != null ? user.getId() : null,
                request.getEmployeeCode().trim().toUpperCase(),
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

        // Optionally assign onboarding plan directly
        if (request.getOnboardingPlanId() != null) {
            planService.assignPlanToEmployee(request.getOnboardingPlanId(),
                    new AssignPlanRequest(employee.getId(), employee.getEmploymentStartDate()));
        }

        auditService.recordAction(orgId, actorUserId, "CREATE_EMPLOYEE", "Employee", employee.getId().toString(),
                "Created employee: " + employee.getEmployeeCode() + " (" + request.getFullName() + ")");

        return toDto(employee);
    }

    @Transactional
    public EmployeeDto updateEmployee(UUID id, UpdateEmployeeRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        employee.setDepartment(request.getDepartment().trim());
        employee.setJobTitle(request.getJobTitle().trim());
        employee.setManagerId(request.getManagerId());
        employee.setEmploymentStartDate(request.getEmploymentStartDate());
        if (request.getOnboardingStatus() != null) {
            employee.setOnboardingStatus(request.getOnboardingStatus());
        }

        if (employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(u -> {
                u.setFullName(request.getFullName().trim());
                userRepository.save(u);
            });
        }

        employee = employeeRepository.save(employee);

        auditService.recordAction(orgId, actorUserId, "UPDATE_EMPLOYEE", "Employee", employee.getId().toString(),
                "Updated details for employee: " + employee.getEmployeeCode());

        return toDto(employee);
    }

    @Transactional
    public EmployeeDto updateStatus(UUID id, OnboardingStatus status) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        OnboardingStatus previousStatus = employee.getOnboardingStatus();
        employee.setOnboardingStatus(status);
        employee = employeeRepository.save(employee);

        auditService.recordAction(orgId, actorUserId, "UPDATE_EMPLOYEE_STATUS", "Employee", employee.getId().toString(),
                "Status transitioned from " + previousStatus + " to " + status);

        return toDto(employee);
    }

    @Transactional
    public void deactivateEmployee(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (employee.getUserId() != null) {
            userRepository.findById(employee.getUserId()).ifPresent(u -> {
                u.setActive(false);
                userRepository.save(u);
            });
        }

        employee.setOnboardingStatus(OnboardingStatus.BLOCKED);
        employeeRepository.save(employee);

        auditService.recordAction(orgId, actorUserId, "DEACTIVATE_EMPLOYEE", "Employee", employee.getId().toString(),
                "Deactivated employee and user account: " + employee.getEmployeeCode());
    }

    private void validateEmployeeAccess(Employee employee) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.getRole() == Role.HR_ADMIN || currentUser.getRole() == Role.HR_MANAGER) {
            return;
        }

        if (currentUser.getRole() == Role.EMPLOYEE) {
            if (employee.getUserId() == null || !employee.getUserId().equals(currentUser.getId())) {
                throw new UnauthorizedException("You are only permitted to view your own employee record");
            }
            return;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Optional<Employee> mgr = employeeRepository.findByUserId(currentUser.getId());
            if (mgr.isEmpty() || !mgr.get().getId().equals(employee.getManagerId())) {
                throw new UnauthorizedException("You are not authorized to view this employee");
            }
        }
    }

    private EmployeeDto toDto(Employee emp) {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(emp.getId());
        dto.setOrganizationId(emp.getOrganizationId());
        dto.setUserId(emp.getUserId());
        dto.setEmployeeCode(emp.getEmployeeCode());
        dto.setDepartment(emp.getDepartment());
        dto.setJobTitle(emp.getJobTitle());
        dto.setManagerId(emp.getManagerId());
        dto.setEmploymentStartDate(emp.getEmploymentStartDate());
        dto.setOnboardingStatus(emp.getOnboardingStatus());
        dto.setCreatedAt(emp.getCreatedAt());

        dto.setFullName(emp.getFullName());
        dto.setEmail(emp.getEmail());
        dto.setPhoneNumber(emp.getPhoneNumber());
        dto.setEmploymentType(emp.getEmploymentType() != null ? emp.getEmploymentType() : "FULL_TIME");
        dto.setInvitationStatus(emp.getUserId() != null ? "ACCEPTED" : "PENDING");

        if (emp.getUserId() != null) {
            userRepository.findById(emp.getUserId()).ifPresent(u -> {
                if (dto.getFullName() == null || dto.getFullName().isBlank()) {
                    dto.setFullName(u.getFullName());
                }
                if (dto.getEmail() == null || dto.getEmail().isBlank()) {
                    dto.setEmail(u.getEmail());
                }
            });
        }

        if (emp.getManagerId() != null) {
            employeeRepository.findById(emp.getManagerId()).ifPresent(m -> {
                if (m.getUserId() != null) {
                    userRepository.findById(m.getUserId()).ifPresent(u -> dto.setManagerName(u.getFullName()));
                } else {
                    dto.setManagerName(m.getEmployeeCode());
                }
            });
        }

        assignmentRepository.findByEmployeeId(emp.getId()).ifPresent(assignment -> {
            dto.setCompletionPercentage(assignment.getCompletionPercentage().doubleValue());
        });

        if (dto.getCompletionPercentage() == null) {
            dto.setCompletionPercentage(emp.getOnboardingStatus() == OnboardingStatus.COMPLETED ? 100.0 : 0.0);
        }

        return dto;
    }
}
