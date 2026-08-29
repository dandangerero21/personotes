package com.example.personotes.services;

import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String baseUrl = (frontendUrl != null ? frontendUrl.trim().replaceAll("/+$", "") : "http://localhost:5173");
        String resetLink = baseUrl + "/reset-password?token=" + token;

        // 1. Console Log (Always generated immediately)
        logger.info("================================================================================");
        logger.info("               PERSO-NOTES PASSWORD RESET NOTIFICATION                          ");
        logger.info("================================================================================");
        logger.info("Recipient: {}", toEmail);
        logger.info("Reset Link: {}", resetLink);
        logger.info("This link will expire in 15 minutes.");
        logger.info("================================================================================");

        // 2. Dispatch email asynchronously in background so web UI responds immediately (<50ms)
        if (mailUsername != null && !mailUsername.trim().isEmpty() &&
            mailPassword != null && !mailPassword.trim().isEmpty() &&
            mailSender != null) {
            CompletableFuture.runAsync(() -> sendViaSmtp(toEmail, resetLink));
        } else {
            logger.warn("SPRING_MAIL_USERNAME or SPRING_MAIL_PASSWORD is not configured. Email will not be dispatched via Gmail.");
        }
    }

    private void sendViaSmtp(String toEmail, String resetLink) {
        try {
            logger.info("Connecting to Gmail SMTP to send password reset email to {}...", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername.trim(), "PersoNotes");
            helper.setTo(toEmail.trim());
            helper.setSubject("Reset your PersoNotes password");
            helper.setText(buildHtmlTemplate(resetLink), true);

            mailSender.send(message);
            logger.info(">>> SUCCESS: Password reset email successfully sent via Gmail to {}", toEmail);
        } catch (Exception e) {
            logger.error(">>> ERROR sending email via Gmail SMTP to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    private String buildHtmlTemplate(String resetLink) {
        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d11; color: #ffffff; margin: 0; padding: 40px 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: #18181f; border-radius: 16px; border: 1px solid #2a2a35; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    .header { text-align: center; margin-bottom: 24px; }
                    .logo { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
                    .logo span { color: #a855f7; }
                    h2 { color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 12px; }
                    p { color: #a1a1aa; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
                    .btn-wrapper { text-align: center; margin: 30px 0; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a2a35; color: #71717a; font-size: 12px; text-align: center; }
                    .link-fallback { word-break: break-all; color: #a855f7; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">Perso<span>Notes</span></div>
                    </div>
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset the password for your PersoNotes account. Click the button below to choose a new password:</p>
                    <div class="btn-wrapper">
                        <a href="{{RESET_LINK}}" class="btn" target="_blank">Reset Password</a>
                    </div>
                    <p>This password reset link will expire in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
                    <div class="footer">
                        <p style="margin-bottom: 8px;">If the button doesn't work, copy and paste this link in your browser:</p>
                        <a href="{{RESET_LINK}}" class="link-fallback">{{RESET_LINK}}</a>
                    </div>
                </div>
            </body>
            </html>
            """;
        return html.replace("{{RESET_LINK}}", resetLink);
    }
}
