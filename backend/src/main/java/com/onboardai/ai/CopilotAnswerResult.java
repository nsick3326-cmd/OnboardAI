package com.onboardai.ai;

import java.util.List;

public class CopilotAnswerResult {

    private String question;
    private String answer;
    private List<String> suggestedNextSteps;
    private String provider;
    private boolean isFallback;

    public CopilotAnswerResult() {}

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<String> getSuggestedNextSteps() {
        return suggestedNextSteps;
    }

    public void setSuggestedNextSteps(List<String> suggestedNextSteps) {
        this.suggestedNextSteps = suggestedNextSteps;
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
