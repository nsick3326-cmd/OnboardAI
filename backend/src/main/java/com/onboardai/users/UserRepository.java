package com.onboardai.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<User> findAllByOrganizationId(UUID organizationId);
    List<User> findAllByOrganizationIdAndRole(UUID organizationId, Role role);
    boolean existsByEmail(String email);
}
