package com.example.personotes.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        // Log the password reset link prominently in the terminal for development & testing
        logger.info("================================================================================");
        logger.info("               PERSO-NOTES PASSWORD RESET NOTIFICATION                          ");
        logger.info("================================================================================");
        logger.info("Recipient: {}", toEmail);
        logger.info("Reset Link: {}", resetLink);
        logger.info("This link will expire in 15 minutes.");
        logger.info("================================================================================");
    }
}
