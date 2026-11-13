package com.onboardai.security;

import com.onboardai.common.UnauthorizedException;
import com.onboardai.users.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityUtilsTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    @DisplayName("Throws UnauthorizedException when no authentication exists in SecurityContext")
    void testThrowsWhenUnauthenticated() {
        assertThatThrownBy(SecurityUtils::getCurrentUser)
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User is not authenticated");
    }

    @Test
    @DisplayName("Correctly evaluates HR_ADMIN role and helpers")
    void testHrAdminRoleHelpers() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId, orgId, "Admin", "admin@acme.com", "pass", Role.HR_ADMIN, true);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        assertThat(SecurityUtils.getCurrentUserId()).isEqualTo(userId);
        assertThat(SecurityUtils.getCurrentOrganizationId()).isEqualTo(orgId);
        assertThat(SecurityUtils.isHrAdmin()).isTrue();
        assertThat(SecurityUtils.isHr()).isTrue();
        assertThat(SecurityUtils.isManager()).isFalse();
        assertThat(SecurityUtils.isEmployee()).isFalse();
    }

    @Test
    @DisplayName("Correctly evaluates EMPLOYEE role and helpers")
    void testEmployeeRoleHelpers() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId, orgId, "Employee", "emp@acme.com", "pass", Role.EMPLOYEE, true);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        assertThat(SecurityUtils.isHrAdmin()).isFalse();
        assertThat(SecurityUtils.isHr()).isFalse();
        assertThat(SecurityUtils.isManager()).isFalse();
        assertThat(SecurityUtils.isEmployee()).isTrue();
    }

    @Test
    @DisplayName("TenantContext overrides default organization ID if explicitly set")
    void testTenantContextPrecedence() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID overrideOrgId = UUID.randomUUID();

        UserPrincipal principal = new UserPrincipal(userId, orgId, "Admin", "admin@acme.com", "pass", Role.HR_ADMIN, true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        TenantContext.setTenantId(overrideOrgId);
        assertThat(SecurityUtils.getCurrentOrganizationId()).isEqualTo(overrideOrgId);
    }
}
