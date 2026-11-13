package com.onboardai.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SetupWorkspaceRequest {

    @NotBlank(message = "Organization name is required")
    private String organizationName;

    private String domain;

    @NotBlank(message = "Administrator full name is required")
    private String adminFullName;

    @NotBlank(message = "Administrator email is required")
    @Email(message = "Valid administrator work email is required")
    private String adminEmail;

    @NotBlank(message = "Administrator password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String adminPassword;

    private String setupKey;

    public SetupWorkspaceRequest() {}

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
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

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public String getSetupKey() {
        return setupKey;
    }

    public void setSetupKey(String setupKey) {
        this.setupKey = setupKey;
    }
}
