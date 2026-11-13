package com.onboardai.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("ResourceNotFoundException returns HTTP 404 with error payload")
    void testHandleNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Employee", "id", "123");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Employee not found with id : '123'");
    }

    @Test
    @DisplayName("BadCredentialsException returns HTTP 401 UNAUTHORIZED")
    void testHandleBadCredentials() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadCredentials(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid email or password");
    }

    @Test
    @DisplayName("AccessDeniedException returns HTTP 403 FORBIDDEN")
    void testHandleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Access denied");
    }

    @Test
    @DisplayName("Unhandled Exception returns HTTP 500 without leaking stack traces")
    void testHandleGeneralException() {
        RuntimeException ex = new RuntimeException("Database connection timeout or internal detail");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneralException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred. Please contact system administrator.");
        // Verify internal detail is not exposed
        assertThat(response.getBody().getMessage()).doesNotContain("Database connection timeout");
    }
}
