package com.onboardai.auth;

public class SetupStatusResponse {

    private boolean initialSetupAllowed;
    private long userCount;
    private long organizationCount;
    private String message;

    public SetupStatusResponse() {}

    public SetupStatusResponse(boolean initialSetupAllowed, long userCount, long organizationCount, String message) {
        this.initialSetupAllowed = initialSetupAllowed;
        this.userCount = userCount;
        this.organizationCount = organizationCount;
        this.message = message;
    }

    public boolean isInitialSetupAllowed() {
        return initialSetupAllowed;
    }

    public void setInitialSetupAllowed(boolean initialSetupAllowed) {
        this.initialSetupAllowed = initialSetupAllowed;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }

    public long getOrganizationCount() {
        return organizationCount;
    }

    public void setOrganizationCount(long organizationCount) {
        this.organizationCount = organizationCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
