package com.onboardai.policies;

import jakarta.validation.constraints.NotBlank;

public class CreatePolicyRequest {

    @NotBlank(message = "Policy title is required")
    private String title;

    private String category = "GENERAL";

    private String description;

    @NotBlank(message = "Policy content is required")
    private String content;

    public CreatePolicyRequest() {}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
