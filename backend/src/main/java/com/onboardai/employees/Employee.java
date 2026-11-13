package com.onboardai.employees;

import com.onboardai.common.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employees", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"organization_id", "employee_code"})
})
public class Employee extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "employment_type", length = 50)
    private String employmentType = "FULL_TIME";

    @Column(name = "department", nullable = false, length = 100)
    private String department;

    @Column(name = "job_title", nullable = false, length = 100)
    private String jobTitle;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "employment_start_date", nullable = false)
    private LocalDate employmentStartDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_status", nullable = false, length = 50)
    private OnboardingStatus onboardingStatus = OnboardingStatus.NOT_STARTED;

    public Employee() {}

    public Employee(UUID organizationId, UUID userId, String employeeCode, String department, String jobTitle, UUID managerId, LocalDate employmentStartDate) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.employeeCode = employeeCode;
        this.department = department;
        this.jobTitle = jobTitle;
        this.managerId = managerId;
        this.employmentStartDate = employmentStartDate;
        this.onboardingStatus = OnboardingStatus.NOT_STARTED;
    }

    public Employee(UUID organizationId, UUID userId, String employeeCode, String fullName, String email, String phoneNumber, String employmentType, String department, String jobTitle, UUID managerId, LocalDate employmentStartDate) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.employmentType = employmentType != null ? employmentType : "FULL_TIME";
        this.department = department;
        this.jobTitle = jobTitle;
        this.managerId = managerId;
        this.employmentStartDate = employmentStartDate;
        this.onboardingStatus = OnboardingStatus.NOT_STARTED;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
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

    public OnboardingStatus getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(OnboardingStatus onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }
}
