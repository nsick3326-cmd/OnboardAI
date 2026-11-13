package com.onboardai.invitations;

import com.onboardai.users.Role;

import java.time.Instant;
import java.util.UUID;

public class InvitationValidationDto {

    private boolean valid;
    private UUID invitationId;
    private String fullName;
    private String email;
    private String department;
    private String jobTitle;
    private Role role;
    private String employmentType;
    private String organizationName;
    private Instant expiresAt;
    private InvitationStatus status;
    private String message;

    public InvitationValidationDto() {}

    public static InvitationValidationDto invalid(String message, InvitationStatus status) {
        InvitationValidationDto dto = new InvitationValidationDto();
        dto.setValid(false);
        dto.setMessage(message);
        dto.setStatus(status);
        return dto;
    }

    public static InvitationValidationDto valid(Invitation invitation, String organizationName) {
        InvitationValidationDto dto = new InvitationValidationDto();
        dto.setValid(true);
        dto.setInvitationId(invitation.getId());
        dto.setFullName(invitation.getFullName());
        dto.setEmail(invitation.getEmail());
        dto.setDepartment(invitation.getDepartment());
        dto.setJobTitle(invitation.getJobTitle());
        dto.setRole(invitation.getRole());
        dto.setEmploymentType(invitation.getEmploymentType());
        dto.setOrganizationName(organizationName);
        dto.setExpiresAt(invitation.getExpiresAt());
        dto.setStatus(invitation.getStatus());
        dto.setMessage("Invitation token is valid");
        return dto;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public UUID getInvitationId() {
        return invitationId;
    }

    public void setInvitationId(UUID invitationId) {
        this.invitationId = invitationId;
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
