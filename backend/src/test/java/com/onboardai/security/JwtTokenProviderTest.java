package com.onboardai.security;

import com.onboardai.users.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    private JwtTokenProvider jwtTokenProvider;
    private UserPrincipal userPrincipal;
    private UUID userId;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS);
        userId = UUID.randomUUID();
        orgId = UUID.randomUUID();
        userPrincipal = new UserPrincipal(
                userId,
                orgId,
                "Elena Vance",
                "admin@acme.com",
                "hashedpassword",
                Role.HR_ADMIN,
                true
        );
    }

    @Test
    @DisplayName("Generate token contains valid claims and passes validation")
    void testGenerateAndValidateToken() {
        String token = jwtTokenProvider.generateToken(userPrincipal);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(jwtTokenProvider.getOrganizationIdFromToken(token)).isEqualTo(orgId);
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("admin@acme.com");
    }

    @Test
    @DisplayName("Validation fails for tampered or invalid token")
    void testTamperedTokenValidationFails() {
        String token = jwtTokenProvider.generateToken(userPrincipal);
        String tamperedToken = token + "corrupted";

        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("Expired token validation fails")
    void testExpiredTokenValidationFails() {
        // Create provider with 1ms expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(TEST_SECRET, 1);
        String token = shortLivedProvider.generateToken(userPrincipal);

        try {
            Thread.sleep(10);
        } catch (InterruptedException ignored) {}

        assertThat(shortLivedProvider.validateToken(token)).isFalse();
    }
}
