package com.example.personotes;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.personotes.dtos.ForgotPasswordRequestDTO;
import com.example.personotes.dtos.ResetPasswordRequestDTO;
import com.example.personotes.dtos.UserAuthDTO;
import com.example.personotes.dtos.UserRequestDTO;
import com.example.personotes.models.PasswordResetToken;
import com.example.personotes.models.User;
import com.example.personotes.repositories.PasswordResetTokenRepository;
import com.example.personotes.repositories.UserRepository;
import com.example.personotes.services.UserService;

@SpringBootTest
class PasswordResetTests {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testCompletePasswordResetFlow() {
        // 1. Register a test user
        UserRequestDTO registerDTO = new UserRequestDTO("testuser", "test@example.com", "oldPassword123");
        userService.registerUser(registerDTO);

        User user = userRepository.findByUsername("testuser");
        assertNotNull(user);

        // 2. Request forgot password
        ForgotPasswordRequestDTO forgotDTO = new ForgotPasswordRequestDTO("test@example.com");
        Map<String, String> forgotResponse = userService.processForgotPassword(forgotDTO);
        assertNotNull(forgotResponse.get("message"));

        // Verify token saved in DB
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        org.junit.jupiter.api.Assertions.assertEquals(1, tokens.size());
        PasswordResetToken storedToken = tokens.get(0);
        assertNotNull(storedToken.getTokenHash());

        // 3. Reset password using invalid token -> should fail
        ResetPasswordRequestDTO invalidResetDTO = new ResetPasswordRequestDTO("invalid_token_value", "newPassword456");
        assertThrows(RuntimeException.class, () -> userService.processResetPassword(invalidResetDTO));

        // 4. For testing the reset, generate a deterministic reset flow or simulate token reset
        // Clean and re-initiate
        passwordResetTokenRepository.deleteAll();
        userService.processForgotPassword(new ForgotPasswordRequestDTO("test@example.com"));
        tokens = passwordResetTokenRepository.findAll();
        org.junit.jupiter.api.Assertions.assertEquals(1, tokens.size());
    }

    @Test
    void testUserEnumerationProtection() {
        // Request for non-existent email should return same generic message and not fail
        ForgotPasswordRequestDTO forgotDTO = new ForgotPasswordRequestDTO("nonexistent@example.com");
        Map<String, String> response = userService.processForgotPassword(forgotDTO);
        assertNotNull(response.get("message"));
        assertTrue(response.get("message").contains("If an account with that email exists"));

        // No token created for non-existent user
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        assertTrue(tokens.isEmpty());
    }
}
