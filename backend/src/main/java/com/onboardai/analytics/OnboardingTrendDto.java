package com.onboardai.analytics;

public class OnboardingTrendDto {

    private String label;
    private long newJoiners;
    private long completed;

    public OnboardingTrendDto() {}

    public OnboardingTrendDto(String label, long newJoiners, long completed) {
        this.label = label;
        this.newJoiners = newJoiners;
        this.completed = completed;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getNewJoiners() {
        return newJoiners;
    }

    public void setNewJoiners(long newJoiners) {
        this.newJoiners = newJoiners;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }
}
