package com.onboardai.documents;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Optional<Document> findByIdAndOrganizationId(UUID id, UUID organizationId);

    List<Document> findAllByOrganizationIdAndEmployeeIdOrderByCreatedAtDesc(UUID organizationId, UUID employeeId);

    Page<Document> findAllByOrganizationId(UUID organizationId, Pageable pageable);

    Page<Document> findAllByOrganizationIdAndVerificationStatus(UUID organizationId, DocumentVerificationStatus status, Pageable pageable);

    long countByOrganizationIdAndVerificationStatus(UUID organizationId, DocumentVerificationStatus status);

    long countByEmployeeIdAndVerificationStatus(UUID employeeId, DocumentVerificationStatus status);

    long countByEmployeeId(UUID employeeId);
}
