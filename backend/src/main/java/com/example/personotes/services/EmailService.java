package com.example.personotes.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.from.email:roldan.gerero21@gmail.com}")
    private String brevoFromEmail;

    @Value("${brevo.from.name:PersoNotes}")
    private String brevoFromName;

    private final HttpClient httpClient;

    public EmailService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String baseUrl = (frontendUrl != null ? frontendUrl.trim().replaceAll("/+$", "") : "http://localhost:5173");
        String resetLink = baseUrl + "/reset-password?token=" + token;

        // 1. Console Log (Always generated immediately for dev & logs)
        logger.info("================================================================================");
        logger.info("               PERSO-NOTES PASSWORD RESET NOTIFICATION                          ");
        logger.info("================================================================================");
        logger.info("Recipient: {}", toEmail);
        logger.info("Reset Link: {}", resetLink);
        logger.info("This link will expire in 15 minutes.");
        logger.info("================================================================================");

        // 2. Dispatch email asynchronously via Brevo HTTPS REST API (Port 443 - never blocked by cloud firewalls)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            CompletableFuture.runAsync(() -> sendViaBrevo(toEmail, resetLink));
        } else {
            logger.warn("BREVO_API_KEY is not configured. Password reset link was only logged to console.");
        }
    }

    private void sendViaBrevo(String toEmail, String resetLink) {
        try {
            logger.info("Dispatching password reset email to {} via Brevo HTTPS API...", toEmail);
            String htmlContent = buildHtmlTemplate(resetLink);
            String payload = String.format(
                "{\"sender\":{\"name\":\"%s\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":\"%s\"}",
                escapeJson(brevoFromName),
                escapeJson(brevoFromEmail),
                escapeJson(toEmail),
                escapeJson("Reset your PersoNotes password"),
                escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info(">>> SUCCESS: Password reset email sent via Brevo to {}. Response: {}", toEmail, response.body());
            } else {
                logger.error(">>> FAILED: Brevo API returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            logger.error(">>> ERROR sending email via Brevo API to {}: {}", toEmail, e.getMessage(), e);
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

    private String escapeJson(String str) {
        if (str == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        String hex = String.format("\\u%04x", (int) c);
                        sb.append(hex);
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}
