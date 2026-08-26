package com.example.personotes.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.personotes.auth.JwtService;
import com.example.personotes.dtos.ForgotPasswordRequestDTO;
import com.example.personotes.dtos.ResetPasswordRequestDTO;
import com.example.personotes.dtos.UserAuthDTO;
import com.example.personotes.dtos.UserRequestDTO;
import com.example.personotes.dtos.UserResponseDTO;
import com.example.personotes.models.PasswordResetToken;
import com.example.personotes.models.User;
import com.example.personotes.repositories.PasswordResetTokenRepository;
import com.example.personotes.repositories.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final SecurityService passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public UserService(
            UserRepository userRepository,
            SecurityService passwordEncoder,
            JwtService jwtService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    public User loadUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public UserResponseDTO registerUser(UserRequestDTO request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        return new UserResponseDTO(user.getUsername(), user.getEmail());
    }

    public UserAuthDTO loginUser(UserRequestDTO request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new RuntimeException("Username and password are required");
        }

        User user = userRepository.findByUsername(request.getUsername().trim());
        if (user == null) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtService.generateToken(user.getUsername());
        return new UserAuthDTO(user.getUsername(), user.getEmail(), token);
    }

    public UserResponseDTO updateUser(Long id, UserRequestDTO request, String username) {
        User user = userRepository.findByIdAndUsername(id, username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email already taken by another account");
            }
            user.setEmail(newEmail);
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Username already taken by another account");
            }
            user.setUsername(newUsername);
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        return new UserResponseDTO(user.getUsername(), user.getEmail());
    }

    public void deleteUser(Long id, String username) {
        User user = userRepository.findByIdAndUsername(id, username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        userRepository.delete(user);
    }

    @Transactional
    public Map<String, String> processForgotPassword(ForgotPasswordRequestDTO request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email);

        if (user != null) {
            // Clean up any existing tokens for this user
            passwordResetTokenRepository.deleteByUser(user);

            // Generate high-entropy 32-byte secure random token
            byte[] randomBytes = new byte[32];
            new SecureRandom().nextBytes(randomBytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

            // Store SHA-256 hash of token in DB for protection against DB leakage
            String tokenHash = hashToken(rawToken);
            LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

            PasswordResetToken resetToken = new PasswordResetToken(tokenHash, user, expiry);
            passwordResetTokenRepository.save(resetToken);

            // Send notification
            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        }

        // Generic response to prevent user enumeration
        return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
    }

    @Transactional
    public Map<String, String> processResetPassword(ResetPasswordRequestDTO request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new RuntimeException("Reset token is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        String tokenHash = hashToken(request.getToken().trim());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new RuntimeException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.delete(resetToken);

        return Map.of("message", "Password has been successfully reset. You can now log in.");
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hashing algorithm SHA-256 not available", e);
        }
    }
}
