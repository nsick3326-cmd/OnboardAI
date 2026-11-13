package com.onboardai.approvals;

import com.onboardai.common.BaseEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approvals")
public class Approval extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "related_document_id")
    private UUID relatedDocumentId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "approver_id")
    private UUID approverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "decision_at")
    private Instant decisionAt;

    public Approval() {}

    public Approval(UUID organizationId, UUID employeeId, UUID relatedDocumentId, UUID taskId, UUID requestedBy, UUID approverId) {
        this.organizationId = organizationId;
        this.employeeId = employeeId;
        this.relatedDocumentId = relatedDocumentId;
        this.taskId = taskId;
        this.requestedBy = requestedBy;
        this.approverId = approverId;
        this.status = ApprovalStatus.PENDING;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public UUID getRelatedDocumentId() {
        return relatedDocumentId;
    }

    public void setRelatedDocumentId(UUID relatedDocumentId) {
        this.relatedDocumentId = relatedDocumentId;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public UUID getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(UUID requestedBy) {
        this.requestedBy = requestedBy;
    }

    public UUID getApproverId() {
        return approverId;
    }

    public void setApproverId(UUID approverId) {
        this.approverId = approverId;
    }

    public ApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(ApprovalStatus status) {
        this.status = status;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Instant getDecisionAt() {
        return decisionAt;
    }

    public void setDecisionAt(Instant decisionAt) {
        this.decisionAt = decisionAt;
    }
}
