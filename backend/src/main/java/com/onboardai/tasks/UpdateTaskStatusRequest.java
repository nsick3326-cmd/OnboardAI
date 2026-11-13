package com.onboardai.tasks;

import jakarta.validation.constraints.NotNull;

public class UpdateTaskStatusRequest {

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    private String comments;

    public UpdateTaskStatusRequest() {}

    public UpdateTaskStatusRequest(TaskStatus status, String comments) {
        this.status = status;
        this.comments = comments;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
