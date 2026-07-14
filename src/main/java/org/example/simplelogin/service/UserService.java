package org.example.simplelogin.service;

import org.example.simplelogin.dto.LoginRequest;
import org.example.simplelogin.dto.SignupRequest;
import org.example.simplelogin.entity.User;
import org.example.simplelogin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${resend.api.key}")
    private String resendApiKey;

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

        // 3. Record this login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 4. Credentials valid — return the user
        return user;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email"));

        // Generate random 8-character temp password
        String tempPassword = generateTempPassword();

        // Send email FIRST — only touch the DB if it actually goes out.
        // Otherwise a failed send leaves the user locked out with a password they never received.
        sendResetEmail(email, tempPassword);

        // Save hashed temp password to DB
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
    }

    private void sendResetEmail(String toEmail, String tempPassword) {
        String url = "https://api.resend.com/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("from", "SimpleLogin <onboarding@resend.dev>"); // swap once you verify your own domain
        body.put("to", new String[]{toEmail});
        body.put("subject", "SimpleLogin - Password Reset");
        body.put("text", "Your temporary password is: " + tempPassword +
                "\n\nPlease log in with this password. You can change it later from your account.");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(url, request, String.class);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }
}