package com.onboardai.mail;

public class EmailDeliveryResult {

    private final boolean sent;
    private final String activationLink;
    private final String message;
    private final boolean configured;

    public EmailDeliveryResult(boolean sent, String activationLink, String message, boolean configured) {
        this.sent = sent;
        this.activationLink = activationLink;
        this.message = message;
        this.configured = configured;
    }

    public static EmailDeliveryResult success(String activationLink, String message) {
        return new EmailDeliveryResult(true, activationLink, message, true);
    }

    public static EmailDeliveryResult notConfigured(String activationLink, String message) {
        return new EmailDeliveryResult(false, activationLink, message, false);
    }

    public static EmailDeliveryResult failed(String activationLink, String message) {
        return new EmailDeliveryResult(false, activationLink, message, true);
    }

    public boolean isSent() {
        return sent;
    }

    public String getActivationLink() {
        return activationLink;
    }

    public String getMessage() {
        return message;
    }

    public boolean isConfigured() {
        return configured;
    }
}
