package com.onboardai.ai;

import java.util.UUID;

public class PolicyCitationDto {

    private UUID policyId;
    private String policyTitle;
    private String sectionTitle;
    private String snippet;

    public PolicyCitationDto() {}

    public PolicyCitationDto(UUID policyId, String policyTitle, String sectionTitle, String snippet) {
        this.policyId = policyId;
        this.policyTitle = policyTitle;
        this.sectionTitle = sectionTitle;
        this.snippet = snippet;
    }

    public UUID getPolicyId() {
        return policyId;
    }

    public void setPolicyId(UUID policyId) {
        this.policyId = policyId;
    }

    public String getPolicyTitle() {
        return policyTitle;
    }

    public void setPolicyTitle(String policyTitle) {
        this.policyTitle = policyTitle;
    }

    public String getSectionTitle() {
        return sectionTitle;
    }

    public void setSectionTitle(String sectionTitle) {
        this.sectionTitle = sectionTitle;
    }

    public String getSnippet() {
        return snippet;
    }

    public void setSnippet(String snippet) {
        this.snippet = snippet;
    }
}
