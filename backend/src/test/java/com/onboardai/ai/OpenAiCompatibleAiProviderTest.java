package com.onboardai.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OpenAiCompatibleAiProviderTest {

    private FallbackAiProvider fallbackProvider;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        fallbackProvider = new FallbackAiProvider();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Provider delegates to FallbackAiProvider when API key is missing")
    void testFallbackWhenApiKeyMissing() {
        OpenAiCompatibleAiProvider provider = new OpenAiCompatibleAiProvider(
                "",
                "https://api.openai.com/v1/chat/completions",
                "gpt-4o-mini",
                fallbackProvider,
                objectMapper
        );

        assertThat(provider.isAvailable()).isFalse();
        assertThat(provider.getProviderName()).contains("DEMO_FALLBACK");

        DocumentExtractionResult docResult = provider.extractDocumentInfo("TAX_FORM", "W4_Form_2026.pdf", "Sample text");
        assertThat(docResult).isNotNull();
        assertThat(docResult.isFallback()).isTrue();
        assertThat(docResult.getCandidateName()).isNotBlank();
        assertThat(docResult.getExtractedFields()).containsKey("Tax Filing Status");
    }

    @Test
    @DisplayName("Checklist generation fallback generates tailored tasks for Engineering role")
    void testChecklistGenerationFallbackForEngineering() {
        OpenAiCompatibleAiProvider provider = new OpenAiCompatibleAiProvider(
                "",
                "https://api.openai.com/v1/chat/completions",
                "gpt-4o-mini",
                fallbackProvider,
                objectMapper
        );

        ChecklistGenerationResult result = provider.generateChecklist(
                "John Doe",
                "Senior Software Engineer",
                "Engineering",
                "Cloud infrastructure",
                Collections.emptyList()
        );

        assertThat(result.isFallback()).isTrue();
        assertThat(result.getSuggestions()).isNotEmpty();
        assertThat(result.getSuggestions().stream().anyMatch(s -> s.getTitle().toLowerCase().contains("repos") || s.getTitle().toLowerCase().contains("build"))).isTrue();
    }

    @Test
    @DisplayName("Policy Q&A fallback produces grounded citations with blockquotes")
    void testPolicyQaFallbackWithCitations() {
        OpenAiCompatibleAiProvider provider = new OpenAiCompatibleAiProvider(
                "",
                "https://api.openai.com/v1/chat/completions",
                "gpt-4o-mini",
                fallbackProvider,
                objectMapper
        );

        PolicyCitationDto citation = new PolicyCitationDto(
                null,
                "Remote Work Policy",
                "Equipment Stipend",
                "Acme provides a $1,000 one-time home office setup stipend."
        );

        PolicyAnswerResult answer = provider.answerPolicyQuestion(
                "What equipment stipend is provided?",
                List.of(citation)
        );

        assertThat(answer.isFallback()).isTrue();
        assertThat(answer.getAnswer()).contains("Remote Work Policy");
        assertThat(answer.getAnswer()).contains("Equipment Stipend");
        assertThat(answer.getCitations()).hasSize(1);
    }
}
