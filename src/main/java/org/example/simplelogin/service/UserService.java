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

    // ... registerUser, loginUser, getUserById stay exactly the same ...

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email"));

        String tempPassword = generateTempPassword();

        // Send the email FIRST — only touch the DB if it actually goes out.
        // Otherwise a failed send leaves the user locked out with a password they never received.
        sendResetEmail(email, tempPassword);

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

    // ... deleteUser stays exactly the same ...
}