package com.onboardai.policies;

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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policies")
@Tag(name = "Company Policies", description = "Endpoints for company policy manuals, ingestion, and RAG knowledge base")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    @Operation(summary = "Get list of company policies with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<PolicyDto>>> getPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        Page<PolicyDto> policies = policyService.getPolicies(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(policies)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get policy handbook details and content by ID")
    public ResponseEntity<ApiResponse<PolicyDto>> getPolicyById(@PathVariable UUID id) {
        PolicyDto policy = policyService.getPolicyById(id);
        return ResponseEntity.ok(ApiResponse.ok(policy));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create and ingest a new company policy handbook with automatic chunking")
    public ResponseEntity<ApiResponse<PolicyDto>> createPolicy(@Valid @RequestBody CreatePolicyRequest request) {
        PolicyDto created = policyService.createPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Policy ingested and chunked successfully", created));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Publish policy for employee and RAG assistant access")
    public ResponseEntity<ApiResponse<PolicyDto>> publishPolicy(@PathVariable UUID id) {
        PolicyDto published = policyService.publishPolicy(id);
        return ResponseEntity.ok(ApiResponse.ok("Policy published successfully", published));
    }
}
