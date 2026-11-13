package com.onboardai.approvals;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    Optional<Approval> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Page<Approval> findAllByOrganizationId(UUID organizationId, Pageable pageable);
    Page<Approval> findAllByOrganizationIdAndStatus(UUID organizationId, ApprovalStatus status, Pageable pageable);
    Page<Approval> findAllByOrganizationIdAndApproverId(UUID organizationId, UUID approverId, Pageable pageable);
    long countByOrganizationIdAndStatus(UUID organizationId, ApprovalStatus status);
}
