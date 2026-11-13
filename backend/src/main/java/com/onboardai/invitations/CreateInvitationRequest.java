package com.onboardai.invitations;

import com.onboardai.users.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class CreateInvitationRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Work email is required")
    @Email(message = "Valid work email is required")
    private String email;

    private String phoneNumber;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Designation/job title is required")
    private String jobTitle;

    @NotNull(message = "Joining date is required")
    private LocalDate employmentStartDate;

    private UUID managerId;

    private String employmentType = "FULL_TIME";

    private Role role = Role.EMPLOYEE;

    private String employeeCode;

    private UUID onboardingPlanId;

    public CreateInvitationRequest() {}

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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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

    public LocalDate getEmploymentStartDate() {
        return employmentStartDate;
    }

    public void setEmploymentStartDate(LocalDate employmentStartDate) {
        this.employmentStartDate = employmentStartDate;
    }

    public UUID getManagerId() {
        return managerId;
    }

    public void setManagerId(UUID managerId) {
        this.managerId = managerId;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public UUID getOnboardingPlanId() {
        return onboardingPlanId;
    }

    public void setOnboardingPlanId(UUID onboardingPlanId) {
        this.onboardingPlanId = onboardingPlanId;
    }
}
