package org.example.simplelogin.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;

    // Short-lived token when "remember me" is NOT checked (e.g. 24 hours).
    @Value("${jwt.expiration-ms}")
    private long defaultExpirationMs;

    // Long-lived token when "remember me" IS checked (e.g. 30 days).
    @Value("${jwt.remember-me-expiration-ms:2592000000}") // 30 days default
    private long rememberMeExpirationMs;

    public JwtService(@Value("${jwt.secret}") String secret) {
        // Requires jwt.secret to be at least 32 chars (HS256 minimum key size).
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String email, boolean rememberMe) {
        long expirationMs = rememberMe ? rememberMeExpirationMs : defaultExpirationMs;
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("rememberMe", rememberMe)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key) // algorithm inferred from key type (HS256 for a 256+ bit HMAC key)
                .compact();
    }

    /**
     * Validates the token and returns the userId embedded in it.
     * Throws JwtException (expired, malformed, bad signature, etc.) if invalid.
     */
    public Long validateAndGetUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.parseLong(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndGetUserId(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}