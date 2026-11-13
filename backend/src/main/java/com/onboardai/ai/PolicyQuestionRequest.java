package com.onboardai.ai;

import jakarta.validation.constraints.NotBlank;

public class PolicyQuestionRequest {

    @NotBlank(message = "Question cannot be blank")
    private String question;

    public PolicyQuestionRequest() {}

    public PolicyQuestionRequest(String question) {
        this.question = question;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
