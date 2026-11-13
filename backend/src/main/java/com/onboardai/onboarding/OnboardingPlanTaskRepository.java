package com.onboardai.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OnboardingPlanTaskRepository extends JpaRepository<OnboardingPlanTask, UUID> {
    List<OnboardingPlanTask> findAllByPlanIdOrderByOrderIndexAsc(UUID planId);
}
