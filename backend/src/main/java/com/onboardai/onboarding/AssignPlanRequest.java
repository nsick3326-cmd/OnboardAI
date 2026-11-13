package com.onboardai.onboarding;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class AssignPlanRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private LocalDate startDate;

    public AssignPlanRequest() {}

    public AssignPlanRequest(UUID employeeId, LocalDate startDate) {
        this.employeeId = employeeId;
        this.startDate = startDate;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}
