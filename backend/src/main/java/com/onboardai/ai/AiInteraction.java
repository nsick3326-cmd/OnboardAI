package com.onboardai.ai;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_interactions")
@EntityListeners(AuditingEntityListener.class)
public class AiInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "feature_type", nullable = false, length = 100)
    private String featureType;

    @Column(name = "request_metadata", columnDefinition = "TEXT")
    private String requestMetadata;

    @Column(name = "response_metadata", columnDefinition = "TEXT")
    private String responseMetadata;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "is_fallback", nullable = false)
    private boolean isFallback = false;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "SUCCESS";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AiInteraction() {}

    public AiInteraction(UUID organizationId, UUID userId, String featureType, String requestMetadata,
                         String responseMetadata, String provider, boolean isFallback, String status) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.featureType = featureType;
        this.requestMetadata = requestMetadata;
        this.responseMetadata = responseMetadata;
        this.provider = provider;
        this.isFallback = isFallback;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFeatureType() {
        return featureType;
    }

    public void setFeatureType(String featureType) {
        this.featureType = featureType;
    }

    public String getRequestMetadata() {
        return requestMetadata;
    }

    public void setRequestMetadata(String requestMetadata) {
        this.requestMetadata = requestMetadata;
    }

    public String getResponseMetadata() {
        return responseMetadata;
    }

    public void setResponseMetadata(String responseMetadata) {
        this.responseMetadata = responseMetadata;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
