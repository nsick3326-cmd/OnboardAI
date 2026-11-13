package com.onboardai.onboarding;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingPlanRepository extends JpaRepository<OnboardingPlan, UUID> {
    Optional<OnboardingPlan> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Page<OnboardingPlan> findAllByOrganizationId(UUID organizationId, Pageable pageable);
    List<OnboardingPlan> findAllByOrganizationIdAndActiveTrue(UUID organizationId);
    boolean existsByOrganizationIdAndName(UUID organizationId, String name);
}
