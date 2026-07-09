package org.example.simplelogin.controller;

import org.example.simplelogin.dto.LoginRequest;
import org.example.simplelogin.dto.SignupRequest;
import org.example.simplelogin.entity.User;
import org.example.simplelogin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        try {
            User savedUser = userService.registerUser(request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Account created successfully");
            response.put("userId", savedUser.getId());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            // thrown by UserService for duplicate email / under-18 checks
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            User user = userService.loginUser(request);
            Map<String, Object> response = new HashMap<>();

            response.put("message", "Login successful");
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("dob", user.getDob());
            response.put("phone", user.getPhone());
            response.put("gender", user.getGender());
            response.put("country", user.getCountry());

            return ResponseEntity.status(HttpStatus.OK).body(response);

        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }
}