package com.onboardai.ai;

import com.onboardai.tasks.TaskCategory;
import com.onboardai.tasks.TaskPriority;

import java.util.UUID;

public class ChecklistSuggestionDto {

    private String id = UUID.randomUUID().toString();
    private String title;
    private String description;
    private TaskCategory category = TaskCategory.GENERAL;
    private TaskPriority priority = TaskPriority.MEDIUM;
    private int relativeDueDays = 5;
    private String rationale;
    private boolean required = true;
    private boolean documentRequired = false;

    public ChecklistSuggestionDto() {}

    public ChecklistSuggestionDto(String title, String description, TaskCategory category, TaskPriority priority,
                                  int relativeDueDays, String rationale, boolean required, boolean documentRequired) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.relativeDueDays = relativeDueDays;
        this.rationale = rationale;
        this.required = required;
        this.documentRequired = documentRequired;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskCategory getCategory() {
        return category;
    }

    public void setCategory(TaskCategory category) {
        this.category = category;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }

    public int getRelativeDueDays() {
        return relativeDueDays;
    }

    public void setRelativeDueDays(int relativeDueDays) {
        this.relativeDueDays = relativeDueDays;
    }

    public String getRationale() {
        return rationale;
    }

    public void setRationale(String rationale) {
        this.rationale = rationale;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public boolean isDocumentRequired() {
        return documentRequired;
    }

    public void setDocumentRequired(boolean documentRequired) {
        this.documentRequired = documentRequired;
    }
}
