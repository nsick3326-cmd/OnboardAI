package com.onboardai.policies;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyChunkRepository extends JpaRepository<PolicyChunk, UUID> {

    List<PolicyChunk> findAllByOrganizationId(UUID organizationId);

    @Query("""
        SELECT c FROM PolicyChunk c
        JOIN c.policy p
        WHERE c.organizationId = :organizationId
        AND p.status = 'PUBLISHED'
        ORDER BY p.title, c.chunkIndex
    """)
    List<PolicyChunk> findAllPublishedChunksByOrganizationId(@Param("organizationId") UUID organizationId);
}
