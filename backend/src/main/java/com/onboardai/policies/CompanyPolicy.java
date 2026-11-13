package com.onboardai.policies;

import com.onboardai.common.BaseEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "company_policies")
public class CompanyPolicy extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category", nullable = false, length = 100)
    private String category = "GENERAL";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED, ARCHIVED

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PolicyChunk> chunks = new ArrayList<>();

    public CompanyPolicy() {}

    public CompanyPolicy(UUID organizationId, String title, String category, String description, String content, UUID uploadedBy) {
        this.organizationId = organizationId;
        this.title = title;
        this.category = category != null ? category : "GENERAL";
        this.description = description;
        this.content = content;
        this.uploadedBy = uploadedBy;
        this.status = "PUBLISHED";
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(UUID uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public List<PolicyChunk> getChunks() {
        return chunks;
    }

    public void setChunks(List<PolicyChunk> chunks) {
        this.chunks = chunks;
    }

    public void addChunk(PolicyChunk chunk) {
        chunks.add(chunk);
        chunk.setPolicy(this);
    }
}
