package com.onboardai.onboarding;

import com.onboardai.common.BaseEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "onboarding_plans")
public class OnboardingPlan extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_role", length = 100)
    private String targetRole;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by")
    private UUID createdBy;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<OnboardingPlanTask> tasks = new ArrayList<>();

    public OnboardingPlan() {}

    public OnboardingPlan(UUID organizationId, String name, String description, String targetRole, String department, UUID createdBy) {
        this.organizationId = organizationId;
        this.name = name;
        this.description = description;
        this.targetRole = targetRole;
        this.department = department;
        this.createdBy = createdBy;
        this.active = true;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public List<OnboardingPlanTask> getTasks() {
        return tasks;
    }

    public void setTasks(List<OnboardingPlanTask> tasks) {
        this.tasks = tasks;
    }

    public void addTask(OnboardingPlanTask task) {
        tasks.add(task);
        task.setPlan(this);
    }
}
