package com.onboardai.onboarding;

import com.onboardai.tasks.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CreatePlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;
    private String targetRole;
    private String department;

    @NotEmpty(message = "Plan must contain at least one task template")
    private List<PlanTaskTemplateDto> tasks;

    public CreatePlanRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<PlanTaskTemplateDto> getTasks() {
        return tasks;
    }

    public void setTasks(List<PlanTaskTemplateDto> tasks) {
        this.tasks = tasks;
    }

    public static class PlanTaskTemplateDto {
        @NotBlank(message = "Task title is required")
        private String title;
        private String description;
        private TaskCategory category = TaskCategory.GENERAL;
        private int relativeDueDays = 3;
        private boolean required = true;
        private String responsibleRole = "EMPLOYEE";
        private boolean documentRequired = false;

        public PlanTaskTemplateDto() {}

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

        public int getRelativeDueDays() {
            return relativeDueDays;
        }

        public void setRelativeDueDays(int relativeDueDays) {
            this.relativeDueDays = relativeDueDays;
        }

        public boolean isRequired() {
            return required;
        }

        public void setRequired(boolean required) {
            this.required = required;
        }

        public String getResponsibleRole() {
            return responsibleRole;
        }

        public void setResponsibleRole(String responsibleRole) {
            this.responsibleRole = responsibleRole;
        }

        public boolean isDocumentRequired() {
            return documentRequired;
        }

        public void setDocumentRequired(boolean documentRequired) {
            this.documentRequired = documentRequired;
        }
    }
}
