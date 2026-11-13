package com.onboardai.mail;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:no-reply@onboardai.io}")
    private String mailFrom;

    @Value("${app.mail.from-name:OnboardAI Team}")
    private String mailFromName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public EmailDeliveryResult sendInvitationEmail(
            String recipientEmail,
            String recipientName,
            String companyName,
            String role,
            String rawToken,
            Instant expiresAt
    ) {
        String cleanFrontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String activationLink = cleanFrontendUrl + "/invitations/accept?token=" + rawToken;

        if (mailHost == null || mailHost.trim().isEmpty()) {
            log.warn("[EMAIL SERVICE] SMTP host not configured. Real email delivery skipped.");
            log.info("[EMAIL SERVICE] Generated secure activation link for {}: {}", recipientEmail, activationLink);
            return EmailDeliveryResult.notConfigured(
                    activationLink,
                    "SMTP not configured. Real email delivery requires configuring SPRING_MAIL_HOST, SPRING_MAIL_PORT, SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD. Secure activation link available below."
            );
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[EMAIL SERVICE] JavaMailSender bean not available. Real email delivery skipped.");
            return EmailDeliveryResult.notConfigured(
                    activationLink,
                    "JavaMailSender not available. Real email delivery requires valid SMTP configuration. Secure activation link available below."
            );
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom, mailFromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Welcome to " + (companyName != null ? companyName : "OnboardAI") + " — Activate Your Account");

            String formattedExpiry = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm z")
                    .withZone(ZoneId.systemDefault())
                    .format(expiresAt);

            String html = buildInvitationHtml(recipientName, companyName, role, activationLink, formattedExpiry);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("[EMAIL SERVICE] Invitation email successfully sent to {}", recipientEmail);
            return EmailDeliveryResult.success(activationLink, "Invitation email sent successfully to " + recipientEmail);
        } catch (Exception ex) {
            log.error("[EMAIL SERVICE] Failed to send email to {}: {}", recipientEmail, ex.getMessage(), ex);
            return EmailDeliveryResult.failed(
                    activationLink,
                    "Failed to deliver email through SMTP server: " + ex.getMessage() + ". You can share the secure activation link directly."
            );
        }
    }

    private String buildInvitationHtml(String name, String company, String role, String link, String expiry) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #241B55 0%%, #4338CA 100%%); padding: 36px 32px; text-align: center; }
                .logo-text { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                .logo-sub { color: #c7d2fe; font-size: 13px; font-weight: 500; margin-top: 4px; }
                .body { padding: 36px 32px; }
                .h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
                .p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
                .card { background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #cbd5e1; }
                .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; }
                .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo-text">Onboard<span style="color: #a78bfa;">AI</span></div>
                  <div class="logo-sub">%s &bull; Workspace Invitation</div>
                </div>
                <div class="body">
                  <h1 class="h1">Welcome, %s!</h1>
                  <p class="p">You have been invited to join <strong>%s</strong> as <strong>%s</strong> on the OnboardAI workspace.</p>
                  <p class="p">To get started with your personalized onboarding workflow and documents, activate your account by setting your password:</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="%s" class="btn">Activate Your Account &rarr;</a>
                  </div>
                  <div class="card">
                    <div style="font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 4px;">Security Notice</div>
                    <div style="font-size: 12px; color: #64748b;">This invitation link is single-use and will expire on <strong>%s</strong>.</div>
                  </div>
                  <p class="p" style="font-size: 12px; color: #94a3b8;">If the button above does not work, copy and paste this URL into your browser:<br><a href="%s" style="color: #7c3aed; word-break: break-all;">%s</a></p>
                </div>
                <div class="footer">
                  &copy; %d OnboardAI Enterprise Systems. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                company != null ? company : "Acme Corp",
                name,
                company != null ? company : "Acme Corp",
                role.replace("_", " "),
                link,
                expiry,
                link,
                link,
                java.time.Year.now().getValue()
        );
    }
}
