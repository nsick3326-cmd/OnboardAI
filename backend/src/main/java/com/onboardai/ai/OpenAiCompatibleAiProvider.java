package com.onboardai.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Primary
public class OpenAiCompatibleAiProvider implements AiProviderService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleAiProvider.class);

    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final FallbackAiProvider fallbackProvider;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleAiProvider(
            @Value("${app.ai.api-key:}") String apiKey,
            @Value("${app.ai.api-url:https://api.openai.com/v1/chat/completions}") String apiUrl,
            @Value("${app.ai.model:gpt-4o-mini}") String model,
            FallbackAiProvider fallbackProvider,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.apiUrl = apiUrl;
        this.model = model;
        this.fallbackProvider = fallbackProvider;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public boolean isAvailable() {
        return !apiKey.isEmpty();
    }

    @Override
    public String getProviderName() {
        return isAvailable() ? "OpenAI-Compatible (" + model + ")" : fallbackProvider.getProviderName();
    }

    @Override
    public DocumentExtractionResult extractDocumentInfo(String documentType, String filename, String textPreview) {
        if (!isAvailable()) {
            return fallbackProvider.extractDocumentInfo(documentType, filename, textPreview);
        }

        try {
            String systemPrompt = "You are a professional HR document parser. Extract structured information as JSON with keys: " +
                    "candidateName, institutionOrEmployer, documentNumber, issueDate, expirationDate, confidence (0.0-1.0), summary, extractedFields (map).";
            String userPrompt = "Document Type: " + documentType + "\nFilename: " + filename + "\nText snippet:\n" + textPreview;

            String responseJson = callLlm(systemPrompt, userPrompt, true);
            JsonNode root = objectMapper.readTree(responseJson);

            DocumentExtractionResult result = new DocumentExtractionResult();
            result.setDocumentType(documentType);
            result.setCandidateName(root.path("candidateName").asText(""));
            result.setInstitutionOrEmployer(root.path("institutionOrEmployer").asText(""));
            result.setDocumentNumber(root.path("documentNumber").asText(""));
            result.setIssueDate(root.path("issueDate").asText(""));
            result.setExpirationDate(root.path("expirationDate").asText(""));
            result.setConfidence(root.path("confidence").asDouble(0.90));
            result.setSummary(root.path("summary").asText("Extracted via " + model));
            result.setProvider("Real LLM: " + model);
            result.setFallback(false);

            return result;
        } catch (Exception e) {
            log.warn("Real AI extraction failed, falling back to synthetic engine: {}", e.getMessage());
            return fallbackProvider.extractDocumentInfo(documentType, filename, textPreview);
        }
    }

    @Override
    public ChecklistGenerationResult generateChecklist(String employeeName, String role, String department, String focus, List<String> existingTasks) {
        if (!isAvailable()) {
            return fallbackProvider.generateChecklist(employeeName, role, department, focus, existingTasks);
        }

        try {
            String systemPrompt = "You are an HR onboarding specialist. Suggest 4-6 personalized onboarding tasks in JSON format with an array 'suggestions' " +
                    "containing objects with: title, description, category (DOCUMENTATION, IT_SETUP, TRAINING, COMPLIANCE, HR_MEETING, GENERAL), " +
                    "priority (LOW, MEDIUM, HIGH, URGENT), relativeDueDays (int), rationale (string), required (boolean), documentRequired (boolean).";
            String userPrompt = "Employee: " + employeeName + "\nRole: " + role + "\nDepartment: " + department + "\nFocus: " + focus;

            String responseJson = callLlm(systemPrompt, userPrompt, true);
            JsonNode root = objectMapper.readTree(responseJson);

            ChecklistGenerationResult result = new ChecklistGenerationResult();
            result.setEmployeeName(employeeName);
            result.setRole(role);
            result.setDepartment(department);
            result.setProvider("Real LLM: " + model);
            result.setFallback(false);

            List<ChecklistSuggestionDto> suggestions = objectMapper.readerForListOf(ChecklistSuggestionDto.class)
                    .readValue(root.path("suggestions"));
            result.setSuggestions(suggestions);

            return result;
        } catch (Exception e) {
            log.warn("Real AI checklist generation failed, falling back to synthetic engine: {}", e.getMessage());
            return fallbackProvider.generateChecklist(employeeName, role, department, focus, existingTasks);
        }
    }

    @Override
    public PolicyAnswerResult answerPolicyQuestion(String question, List<PolicyCitationDto> citations) {
        if (!isAvailable()) {
            return fallbackProvider.answerPolicyQuestion(question, citations);
        }

        try {
            StringBuilder contextBuilder = new StringBuilder();
            for (PolicyCitationDto c : citations) {
                contextBuilder.append("Policy: ").append(c.getPolicyTitle())
                        .append("\nSection: ").append(c.getSectionTitle())
                        .append("\nExcerpt: ").append(c.getSnippet())
                        .append("\n---\n");
            }

            String systemPrompt = "You are an internal company HR policy assistant. Answer the user's question using ONLY the provided policy excerpts. " +
                    "If the answer is not in the text, say 'I cannot find this information in the approved policy manuals.' Do not invent rules.";
            String userPrompt = "Policy Context:\n" + contextBuilder + "\nQuestion: " + question;

            String answer = callLlm(systemPrompt, userPrompt, false);

            PolicyAnswerResult result = new PolicyAnswerResult();
            result.setQuestion(question);
            result.setAnswer(answer);
            result.setCitations(citations);
            result.setProvider("Real LLM: " + model);
            result.setFallback(false);
            return result;
        } catch (Exception e) {
            log.warn("Real AI policy QA failed, falling back to synthetic engine: {}", e.getMessage());
            return fallbackProvider.answerPolicyQuestion(question, citations);
        }
    }

    @Override
    public CopilotAnswerResult answerCopilotQuestion(String question, String taskContext, String employeeContext, List<String> pendingTasks) {
        if (!isAvailable()) {
            return fallbackProvider.answerCopilotQuestion(question, taskContext, employeeContext, pendingTasks);
        }

        try {
            String systemPrompt = "You are OnboardAI Copilot, an empathetic and actionable guide for new employees. Provide clear, encouraging answers and recommend next steps.";
            String userPrompt = "Employee: " + employeeContext + "\nTask Context: " + taskContext + "\nPending Tasks: " + pendingTasks + "\nQuestion: " + question;

            String answer = callLlm(systemPrompt, userPrompt, false);

            CopilotAnswerResult result = new CopilotAnswerResult();
            result.setQuestion(question);
            result.setAnswer(answer);
            result.setProvider("Real LLM: " + model);
            result.setFallback(false);
            result.setSuggestedNextSteps(List.of("Review pending checklist items", "Check with your manager if blocked"));
            return result;
        } catch (Exception e) {
            log.warn("Real AI copilot failed, falling back to synthetic engine: {}", e.getMessage());
            return fallbackProvider.answerCopilotQuestion(question, taskContext, employeeContext, pendingTasks);
        }
    }

    private String callLlm(String systemPrompt, String userPrompt, boolean jsonMode) throws Exception {
        Map<String, Object> messageSystem = Map.of("role", "system", "content", systemPrompt);
        Map<String, Object> messageUser = Map.of("role", "user", "content", userPrompt);

        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(messageSystem, messageUser));
        requestBody.put("temperature", 0.3);

        if (jsonMode) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(20))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new RuntimeException("API error: HTTP " + response.statusCode() + " -> " + response.body());
        }

        JsonNode responseNode = objectMapper.readTree(response.body());
        return responseNode.path("choices").path(0).path("message").path("content").asText();
    }
}
