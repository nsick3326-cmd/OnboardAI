package com.onboardai.auth;

import java.util.UUID;

public class SetupWorkspaceResponse {

    private UUID organizationId;
    private String organizationName;
    private UUID adminUserId;
    private String adminFullName;
    private String adminEmail;
    private String token;
    private String message;

    public SetupWorkspaceResponse() {}

    public SetupWorkspaceResponse(UUID organizationId, String organizationName, UUID adminUserId, String adminFullName, String adminEmail, String token, String message) {
        this.organizationId = organizationId;
        this.organizationName = organizationName;
        this.adminUserId = adminUserId;
        this.adminFullName = adminFullName;
        this.adminEmail = adminEmail;
        this.token = token;
        this.message = message;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public UUID getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(UUID adminUserId) {
        this.adminUserId = adminUserId;
    }

    public String getAdminFullName() {
        return adminFullName;
    }

    public void setAdminFullName(String adminFullName) {
        this.adminFullName = adminFullName;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
