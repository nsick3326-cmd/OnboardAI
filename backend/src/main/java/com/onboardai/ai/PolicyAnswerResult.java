package com.onboardai.ai;

import java.util.List;

public class PolicyAnswerResult {

    private String question;
    private String answer;
    private List<PolicyCitationDto> citations;
    private String provider;
    private boolean isFallback;

    public PolicyAnswerResult() {}

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

    public List<PolicyCitationDto> getCitations() {
        return citations;
    }

    public void setCitations(List<PolicyCitationDto> citations) {
        this.citations = citations;
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
