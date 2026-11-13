package com.onboardai.audit;

import com.onboardai.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    public void recordAction(UUID organizationId, UUID actorUserId, String action, String entityType, String entityId, String details) {
        AuditLog log = new AuditLog(organizationId, actorUserId, action, entityType, entityId, details);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        UUID organizationId = SecurityUtils.getCurrentOrganizationId();
        return auditLogRepository.findAllByOrganizationIdOrderByCreatedAtDesc(organizationId, pageable);
    }
}
