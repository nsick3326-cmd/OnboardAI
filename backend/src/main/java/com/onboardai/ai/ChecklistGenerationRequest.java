package com.onboardai.ai;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ChecklistGenerationRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String additionalFocus;

    public ChecklistGenerationRequest() {}

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getAdditionalFocus() {
        return additionalFocus;
    }

    public void setAdditionalFocus(String additionalFocus) {
        this.additionalFocus = additionalFocus;
    }
}
