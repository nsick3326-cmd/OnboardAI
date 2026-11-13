package com.onboardai.ai;

import java.util.List;
import java.util.UUID;

public class ChecklistGenerationResult {

    private UUID employeeId;
    private String employeeName;
    private String role;
    private String department;
    private List<ChecklistSuggestionDto> suggestions;
    private String provider;
    private boolean isFallback;

    public ChecklistGenerationResult() {}

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<ChecklistSuggestionDto> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<ChecklistSuggestionDto> suggestions) {
        this.suggestions = suggestions;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isFallback() {
        return isFallback;
    }

    public void setFallback(boolean fallback) {
        isFallback = fallback;
    }
}
