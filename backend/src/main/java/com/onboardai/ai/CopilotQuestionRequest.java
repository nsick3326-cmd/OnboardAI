package com.onboardai.ai;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public class CopilotQuestionRequest {

    @NotBlank(message = "Question cannot be blank")
    private String question;

    private UUID taskId;

    public CopilotQuestionRequest() {}

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }
}
