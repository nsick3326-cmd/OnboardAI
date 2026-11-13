package com.onboardai.policies;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PolicyRepository extends JpaRepository<CompanyPolicy, UUID> {
    Optional<CompanyPolicy> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Page<CompanyPolicy> findAllByOrganizationId(UUID organizationId, Pageable pageable);
    List<CompanyPolicy> findAllByOrganizationIdAndStatus(UUID organizationId, String status);
    long countByOrganizationId(UUID organizationId);
}
