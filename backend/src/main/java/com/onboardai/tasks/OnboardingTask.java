package com.onboardai.tasks;

import com.onboardai.common.BaseEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "onboarding_tasks")
public class OnboardingTask extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private TaskCategory category = TaskCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private TaskStatus status = TaskStatus.NOT_STARTED;

    @Column(name = "required", nullable = false)
    private boolean required = true;

    @Column(name = "document_required", nullable = false)
    private boolean documentRequired = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    public OnboardingTask() {}

    public OnboardingTask(UUID organizationId, UUID assignmentId, UUID employeeId, String title, String description,
                          TaskCategory category, TaskPriority priority, UUID assignedToUserId, LocalDate dueDate,
                          boolean required, boolean documentRequired) {
        this.organizationId = organizationId;
        this.assignmentId = assignmentId;
        this.employeeId = employeeId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.assignedToUserId = assignedToUserId;
        this.dueDate = dueDate;
        this.status = TaskStatus.NOT_STARTED;
        this.required = required;
        this.documentRequired = documentRequired;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
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

    public UUID getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(UUID assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
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

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
