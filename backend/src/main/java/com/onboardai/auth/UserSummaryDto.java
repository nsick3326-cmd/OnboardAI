package com.onboardai.auth;

import com.onboardai.users.Role;

import java.util.UUID;

public class UserSummaryDto {

    private UUID id;
    private UUID organizationId;
    private String fullName;
    private String email;
    private Role role;
    private UUID employeeId;

    public UserSummaryDto() {}

    public UserSummaryDto(UUID id, UUID organizationId, String fullName, String email, Role role, UUID employeeId) {
        this.id = id;
        this.organizationId = organizationId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.employeeId = employeeId;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }
}
