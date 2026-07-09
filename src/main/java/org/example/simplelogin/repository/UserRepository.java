package org.example.simplelogin.repository;

import org.example.simplelogin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA auto-generates the query from the method name.
    // Used to check if an email is already registered before saving.
    boolean existsByEmail(String email);

    // Used during login to fetch the user record by email so we can
    // verify the submitted password against the stored hash.
    Optional<User> findByEmail(String email);
}