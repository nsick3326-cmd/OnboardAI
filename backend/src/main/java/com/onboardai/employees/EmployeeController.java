package com.onboardai.employees;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employees", description = "Endpoints for employee management, directory, and status lifecycle")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "Get paginated employee list with search and filters")
    public ResponseEntity<ApiResponse<PagedResponse<EmployeeDto>>> getEmployees(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) OnboardingStatus status,
            @RequestParam(required = false) UUID managerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        Page<EmployeeDto> employees = employeeService.getEmployees(department, status, managerId, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(employees)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee profile details by ID")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable UUID id) {
        EmployeeDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok(employee));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new employee and optionally assign an onboarding plan")
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeDto created = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Employee created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Update employee details")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployee(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeDto updated = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Employee updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Update employee onboarding status")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        OnboardingStatus status = OnboardingStatus.valueOf(statusStr.toUpperCase());
        EmployeeDto updated = employeeService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Employee status updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN')")
    @Operation(summary = "Deactivate employee and user account")
    public ResponseEntity<ApiResponse<String>> deactivateEmployee(@PathVariable UUID id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok("Employee deactivated successfully", "Account disabled"));
    }
}
