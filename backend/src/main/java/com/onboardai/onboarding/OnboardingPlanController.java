package com.onboardai.onboarding;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/onboarding-plans")
@Tag(name = "Onboarding Plans", description = "Endpoints for creating and managing onboarding plans and assignments")
public class OnboardingPlanController {

    private final OnboardingPlanService planService;

    public OnboardingPlanController(OnboardingPlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    @Operation(summary = "Get paginated list of onboarding plans")
    public ResponseEntity<ApiResponse<PagedResponse<OnboardingPlanDto>>> getPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<OnboardingPlanDto> plans = planService.getPlans(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(plans)));
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active onboarding plans for assignment selection")
    public ResponseEntity<ApiResponse<List<OnboardingPlanDto>>> getActivePlans() {
        List<OnboardingPlanDto> plans = planService.getActivePlans();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get onboarding plan details including task templates")
    public ResponseEntity<ApiResponse<OnboardingPlanDto>> getPlanById(@PathVariable UUID id) {
        OnboardingPlanDto plan = planService.getPlanById(id);
        return ResponseEntity.ok(ApiResponse.ok(plan));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new onboarding plan with task templates")
    public ResponseEntity<ApiResponse<OnboardingPlanDto>> createPlan(@Valid @RequestBody CreatePlanRequest request) {
        OnboardingPlanDto created = planService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Onboarding plan created successfully", created));
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Assign onboarding plan to an employee and instantiate tasks")
    public ResponseEntity<ApiResponse<OnboardingAssignmentDto>> assignPlan(
            @PathVariable UUID id,
            @Valid @RequestBody AssignPlanRequest request) {
        OnboardingAssignmentDto assignment = planService.assignPlanToEmployee(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Plan assigned and tasks instantiated successfully", assignment));
    }
}
