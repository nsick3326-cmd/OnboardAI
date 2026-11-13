package com.onboardai.invitations;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invitations")
@Tag(name = "Invitations", description = "Employee onboarding invitations and account activation")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create an employee and send an onboarding invitation")
    public ResponseEntity<InvitationDto> createInvitation(@Valid @RequestBody CreateInvitationRequest request) {
        InvitationDto response = invitationService.createEmployeeAndInvite(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "List all company invitations with pagination, status filter and search")
    public ResponseEntity<Page<InvitationDto>> getInvitations(
            @RequestParam(required = false) InvitationStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<InvitationDto> invitations = invitationService.getInvitations(status, search, pageable);
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Get invitation details by ID")
    public ResponseEntity<InvitationDto> getInvitationById(@PathVariable UUID id) {
        InvitationDto invitation = invitationService.getInvitationById(id);
        return ResponseEntity.ok(invitation);
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Resend invitation (regenerates token and invalidates old token)")
    public ResponseEntity<InvitationDto> resendInvitation(@PathVariable UUID id) {
        InvitationDto response = invitationService.resendInvitation(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Revoke a pending or expired invitation")
    public ResponseEntity<InvitationDto> revokeInvitation(@PathVariable UUID id) {
        InvitationDto response = invitationService.revokeInvitation(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate an invitation token before account activation (public)")
    public ResponseEntity<InvitationValidationDto> validateToken(@RequestParam String token) {
        InvitationValidationDto validation = invitationService.validateToken(token);
        return ResponseEntity.ok(validation);
    }

    @PostMapping("/accept")
    @Operation(summary = "Accept invitation and activate account by setting password (public)")
    public ResponseEntity<InvitationDto> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        InvitationDto response = invitationService.acceptInvitation(request);
        return ResponseEntity.ok(response);
    }
}
