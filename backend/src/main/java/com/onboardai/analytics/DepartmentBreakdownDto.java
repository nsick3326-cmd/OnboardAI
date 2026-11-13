package com.onboardai.analytics;

public class DepartmentBreakdownDto {

    private String department;
    private long total;
    private long inProgress;
    private long completed;
    private double completionRate;

    public DepartmentBreakdownDto() {}

    public DepartmentBreakdownDto(String department, long total, long inProgress, long completed, double completionRate) {
        this.department = department;
        this.total = total;
        this.inProgress = inProgress;
        this.completed = completed;
        this.completionRate = completionRate;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getInProgress() {
        return inProgress;
    }

    public void setInProgress(long inProgress) {
        this.inProgress = inProgress;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }
}
