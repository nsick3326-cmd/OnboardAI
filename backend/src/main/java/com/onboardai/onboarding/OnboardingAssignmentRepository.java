package com.onboardai.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingAssignmentRepository extends JpaRepository<OnboardingAssignment, UUID> {
    Optional<OnboardingAssignment> findByEmployeeId(UUID employeeId);
    Optional<OnboardingAssignment> findByIdAndOrganizationId(UUID id, UUID organizationId);
    boolean existsByEmployeeId(UUID employeeId);
}
