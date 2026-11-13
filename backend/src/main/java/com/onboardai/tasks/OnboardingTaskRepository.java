package com.onboardai.tasks;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, UUID> {

    Optional<OnboardingTask> findByIdAndOrganizationId(UUID id, UUID organizationId);

    List<OnboardingTask> findAllByAssignmentId(UUID assignmentId);

    List<OnboardingTask> findAllByEmployeeId(UUID employeeId);

    long countByAssignmentIdAndRequiredTrue(UUID assignmentId);

    long countByAssignmentIdAndRequiredTrueAndStatus(UUID assignmentId, TaskStatus status);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndStatus(UUID organizationId, TaskStatus status);

    long countByOrganizationIdAndDueDateBeforeAndStatusNot(UUID organizationId, LocalDate dueDate, TaskStatus status);

    long countByEmployeeIdAndDueDateBeforeAndStatusNot(UUID employeeId, LocalDate dueDate, TaskStatus status);

    long countByEmployeeIdAndStatus(UUID employeeId, TaskStatus status);

    long countByEmployeeId(UUID employeeId);

    @Query("""
        SELECT t FROM OnboardingTask t
        WHERE t.organizationId = :organizationId
        AND (:employeeId IS NULL OR t.employeeId = :employeeId)
        AND (:assignedToUserId IS NULL OR t.assignedToUserId = :assignedToUserId)
        AND (:category IS NULL OR t.category = :category)
        AND (:status IS NULL OR t.status = :status)
        AND (:overdue IS NULL OR (:overdue = true AND t.dueDate < CURRENT_DATE AND t.status != 'COMPLETED')
                             OR (:overdue = false AND (t.dueDate >= CURRENT_DATE OR t.status = 'COMPLETED')))
        ORDER BY t.dueDate ASC NULLS LAST, t.createdAt ASC
    """)
    Page<OnboardingTask> filterTasks(
            @Param("organizationId") UUID organizationId,
            @Param("employeeId") UUID employeeId,
            @Param("assignedToUserId") UUID assignedToUserId,
            @Param("category") TaskCategory category,
            @Param("status") TaskStatus status,
            @Param("overdue") Boolean overdue,
            Pageable pageable
    );
}
