package com.onboardai.approvals;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals")
@Tag(name = "Approvals", description = "Endpoints for managing approvals inbox, decisions, and sign-offs")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    @Operation(summary = "Get approvals queue for current user or organization")
    public ResponseEntity<ApiResponse<PagedResponse<ApprovalDto>>> getApprovals(
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        Page<ApprovalDto> approvals = approvalService.getApprovals(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(approvals)));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a pending approval item")
    public ResponseEntity<ApiResponse<ApprovalDto>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String comments = body != null ? body.get("comments") : "Approved";
        ApprovalDto approved = approvalService.approve(id, comments);
        return ResponseEntity.ok(ApiResponse.ok("Item approved successfully", approved));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a pending approval item with explanation")
    public ResponseEntity<ApiResponse<ApprovalDto>> reject(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String comments = body != null ? body.get("comments") : "Rejected";
        ApprovalDto rejected = approvalService.reject(id, comments);
        return ResponseEntity.ok(ApiResponse.ok("Item rejected", rejected));
    }
}
