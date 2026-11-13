package com.onboardai.onboarding;

import com.onboardai.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Onboarding Assignments", description = "Endpoints for employee onboarding assignments and progress")
public class OnboardingAssignmentController {

    private final OnboardingPlanService planService;

    public OnboardingAssignmentController(OnboardingPlanService planService) {
        this.planService = planService;
    }

    @GetMapping("/employees/{id}/onboarding")
    @Operation(summary = "Get active onboarding assignment and progress for an employee")
    public ResponseEntity<ApiResponse<OnboardingAssignmentDto>> getEmployeeAssignment(@PathVariable UUID id) {
        OnboardingAssignmentDto assignment = planService.getEmployeeAssignment(id);
        return ResponseEntity.ok(ApiResponse.ok(assignment));
    }
}
