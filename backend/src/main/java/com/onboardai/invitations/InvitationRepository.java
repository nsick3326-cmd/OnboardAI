package com.onboardai.invitations;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    Optional<Invitation> findByTokenHash(String tokenHash);

    Optional<Invitation> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Invitation> findByEmployeeId(UUID employeeId);

    Optional<Invitation> findByOrganizationIdAndEmailAndStatus(UUID organizationId, String email, InvitationStatus status);

    List<Invitation> findAllByOrganizationId(UUID organizationId);

    boolean existsByOrganizationIdAndEmailAndStatus(UUID organizationId, String email, InvitationStatus status);

    long countByOrganizationIdAndStatus(UUID organizationId, InvitationStatus status);

    @Query("""
        SELECT i FROM Invitation i
        WHERE i.organizationId = :organizationId
        AND (:status IS NULL OR i.status = :status)
        AND (cast(:search as string) IS NULL OR
             LOWER(i.fullName) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR
             LOWER(i.email) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR
             LOWER(i.department) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR
             LOWER(i.jobTitle) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))
        ORDER BY i.createdAt DESC
    """)
    Page<Invitation> searchInvitations(
            @Param("organizationId") UUID organizationId,
            @Param("status") InvitationStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
