package com.onboardai.employees;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class CreateEmployeeRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    private UUID managerId;

    @NotNull(message = "Employment start date is required")
    private LocalDate employmentStartDate;

    private String phoneNumber;

    private String employmentType = "FULL_TIME";

    private com.onboardai.users.Role role = com.onboardai.users.Role.EMPLOYEE;

    private String temporaryPassword;

    private UUID onboardingPlanId;

    public CreateEmployeeRequest() {}

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

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
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

    public UUID getManagerId() {
        return managerId;
    }

    public void setManagerId(UUID managerId) {
        this.managerId = managerId;
    }

    public LocalDate getEmploymentStartDate() {
        return employmentStartDate;
    }

    public void setEmploymentStartDate(LocalDate employmentStartDate) {
        this.employmentStartDate = employmentStartDate;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public com.onboardai.users.Role getRole() {
        return role;
    }

    public void setRole(com.onboardai.users.Role role) {
        this.role = role;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }

    public UUID getOnboardingPlanId() {
        return onboardingPlanId;
    }

    public void setOnboardingPlanId(UUID onboardingPlanId) {
        this.onboardingPlanId = onboardingPlanId;
    }
}
