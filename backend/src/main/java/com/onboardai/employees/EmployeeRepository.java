package com.onboardai.employees;

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
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Employee> findByUserId(UUID userId);

    Optional<Employee> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    boolean existsByOrganizationIdAndEmployeeCode(UUID organizationId, String employeeCode);

    Page<Employee> findAllByOrganizationId(UUID organizationId, Pageable pageable);

    Page<Employee> findAllByOrganizationIdAndManagerId(UUID organizationId, UUID managerId, Pageable pageable);

    List<Employee> findAllByOrganizationIdAndManagerId(UUID organizationId, UUID managerId);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndOnboardingStatus(UUID organizationId, OnboardingStatus status);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.organizationId = :organizationId
        AND (cast(:department as string) IS NULL OR LOWER(e.department) = LOWER(cast(:department as string)))
        AND (:status IS NULL OR e.onboardingStatus = :status)
        AND (:managerId IS NULL OR e.managerId = :managerId)
        AND (cast(:search as string) IS NULL OR 
             LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR 
             LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))
    """)
    Page<Employee> searchEmployees(
            @Param("organizationId") UUID organizationId,
            @Param("department") String department,
            @Param("status") OnboardingStatus status,
            @Param("managerId") UUID managerId,
            @Param("search") String search,
            Pageable pageable
    );
}
