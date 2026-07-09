package org.example.simplelogin.service;

import org.example.simplelogin.dto.LoginRequest;
import org.example.simplelogin.dto.SignupRequest;
import org.example.simplelogin.entity.User;
import org.example.simplelogin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(SignupRequest request) {

        // 1. Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // 2. Check age >= 18 (this needs real date math, not just an annotation)
        int age = Period.between(request.getDob(), LocalDate.now()).getYears();
        if (age < 18) {
            throw new IllegalArgumentException("You must be at least 18 years old");
        }

        // 3. Map DTO -> Entity
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // never save plain text
        user.setDob(request.getDob());
        user.setPhone(request.getPhone());
        user.setGender(request.getGender());
        user.setCountry(request.getCountry());
        user.setTermsAccepted(request.isTermsAccepted());

        // 4. Save to DB
        return userRepository.save(user);
    }

    public User loginUser(LoginRequest request) {

        // 1. Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // 2. Compare raw password against stored BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password"); // same message on purpose
        }

        // 3. Credentials valid — return the user
        return user;
    }
}