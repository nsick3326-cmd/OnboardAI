package com.onboardai.analytics;

public class OverviewMetricsDto {

    private long totalEmployees;
    private long employeesOnboarding;
    private long completedOnboardings;
    private double onboardingCompletionRate;
    private long tasksCompleted;
    private long tasksPending;
    private long tasksOverdue;
    private long pendingDocumentVerifications;
    private long pendingApprovals;

    public OverviewMetricsDto() {}

    public long getTotalEmployees() {
        return totalEmployees;
    }

    public void setTotalEmployees(long totalEmployees) {
        this.totalEmployees = totalEmployees;
    }

    public long getEmployeesOnboarding() {
        return employeesOnboarding;
    }

    public void setEmployeesOnboarding(long employeesOnboarding) {
        this.employeesOnboarding = employeesOnboarding;
    }

    public long getCompletedOnboardings() {
        return completedOnboardings;
    }

    public void setCompletedOnboardings(long completedOnboardings) {
        this.completedOnboardings = completedOnboardings;
    }

    public double getOnboardingCompletionRate() {
        return onboardingCompletionRate;
    }

    public void setOnboardingCompletionRate(double onboardingCompletionRate) {
        this.onboardingCompletionRate = onboardingCompletionRate;
    }

    public long getTasksCompleted() {
        return tasksCompleted;
    }

    public void setTasksCompleted(long tasksCompleted) {
        this.tasksCompleted = tasksCompleted;
    }

    public long getTasksPending() {
        return tasksPending;
    }

    public void setTasksPending(long tasksPending) {
        this.tasksPending = tasksPending;
    }

    public long getTasksOverdue() {
        return tasksOverdue;
    }

    public void setTasksOverdue(long tasksOverdue) {
        this.tasksOverdue = tasksOverdue;
    }

    public long getPendingDocumentVerifications() {
        return pendingDocumentVerifications;
    }

    public void setPendingDocumentVerifications(long pendingDocumentVerifications) {
        this.pendingDocumentVerifications = pendingDocumentVerifications;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }
}
