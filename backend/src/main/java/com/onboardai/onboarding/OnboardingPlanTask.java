package com.onboardai.onboarding;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.onboardai.tasks.TaskCategory;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_plan_tasks")
@EntityListeners(AuditingEntityListener.class)
public class OnboardingPlanTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    @JsonIgnore
    private OnboardingPlan plan;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private TaskCategory category = TaskCategory.GENERAL;

    @Column(name = "relative_due_days", nullable = false)
    private int relativeDueDays = 3;

    @Column(name = "required", nullable = false)
    private boolean required = true;

    @Column(name = "responsible_role", nullable = false, length = 50)
    private String responsibleRole = "EMPLOYEE";

    @Column(name = "document_required", nullable = false)
    private boolean documentRequired = false;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public OnboardingPlanTask() {}

    public OnboardingPlanTask(String title, String description, TaskCategory category, int relativeDueDays,
                              boolean required, String responsibleRole, boolean documentRequired, int orderIndex) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.relativeDueDays = relativeDueDays;
        this.required = required;
        this.responsibleRole = responsibleRole;
        this.documentRequired = documentRequired;
        this.orderIndex = orderIndex;
    }

    public UUID getId() {
        return id;
    }

    public OnboardingPlan getPlan() {
        return plan;
    }

    public void setPlan(OnboardingPlan plan) {
        this.plan = plan;
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

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
