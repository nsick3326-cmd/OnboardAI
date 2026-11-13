package com.onboardai.security;

import com.onboardai.common.UnauthorizedException;
import com.onboardai.users.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new UnauthorizedException("User is not authenticated");
    }

    public static UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static UUID getCurrentOrganizationId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            return tenantId;
        }
        return getCurrentUser().getOrganizationId();
    }

    public static Role getCurrentUserRole() {
        return getCurrentUser().getRole();
    }

    public static boolean isHr() {
        Role role = getCurrentUserRole();
        return role == Role.HR_ADMIN || role == Role.HR_MANAGER;
    }

    public static boolean isHrAdmin() {
        return getCurrentUserRole() == Role.HR_ADMIN;
    }

    public static boolean isManager() {
        return getCurrentUserRole() == Role.MANAGER;
    }

    public static boolean isEmployee() {
        return getCurrentUserRole() == Role.EMPLOYEE;
    }
}
