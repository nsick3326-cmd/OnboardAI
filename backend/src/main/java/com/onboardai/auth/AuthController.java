package com.onboardai.auth;

import com.onboardai.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and session management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset account password with security verification")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. You may now sign in with your new credentials.", "Success"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser() {
        UserSummaryDto response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/setup-status")
    @Operation(summary = "Check whether initial company workspace setup is open or locked")
    public ResponseEntity<ApiResponse<SetupStatusResponse>> getSetupStatus() {
        SetupStatusResponse response = authService.getSetupStatus();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/setup-workspace")
    @Operation(summary = "Initialize company workspace and provision the first HR Administrator")
    public ResponseEntity<ApiResponse<SetupWorkspaceResponse>> setupWorkspace(@Valid @RequestBody SetupWorkspaceRequest request) {
        SetupWorkspaceResponse response = authService.setupWorkspace(request);
        return ResponseEntity.ok(ApiResponse.ok("Company workspace successfully established", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user and invalidate client session")
    public ResponseEntity<ApiResponse<String>> logout() {
        return ResponseEntity.ok(ApiResponse.ok("Logout successful", "Session ended"));
    }
}
