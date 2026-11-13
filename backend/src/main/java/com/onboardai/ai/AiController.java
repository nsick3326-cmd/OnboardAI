package com.onboardai.ai;

import com.onboardai.common.ApiResponse;
import com.onboardai.tasks.OnboardingTask;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Services", description = "Endpoints for AI-assisted document extraction, checklist generation, RAG policy assistant, and employee copilot")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/documents/{id}/extract")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Feature A: AI Document Information Extraction")
    public ResponseEntity<ApiResponse<DocumentExtractionResult>> extractDocument(@PathVariable UUID id) {
        DocumentExtractionResult result = aiService.extractDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document fields extracted", result));
    }

    @PostMapping("/onboarding-checklists/generate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Feature B: Generate AI-assisted personalized onboarding checklist suggestions")
    public ResponseEntity<ApiResponse<ChecklistGenerationResult>> generateChecklist(
            @Valid @RequestBody ChecklistGenerationRequest request) {
        ChecklistGenerationResult result = aiService.generateChecklist(request);
        return ResponseEntity.ok(ApiResponse.ok("Checklist suggestions generated", result));
    }

    @PostMapping("/onboarding-checklists/{id}/approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Feature B: Review, approve, and instantiate selected AI checklist suggestions into real tasks")
    public ResponseEntity<ApiResponse<List<OnboardingTask>>> approveChecklist(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveChecklistRequest request) {
        List<OnboardingTask> tasks = aiService.approveChecklist(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Selected AI checklist suggestions approved and tasks created", tasks));
    }

    @PostMapping("/policy-assistant/ask")
    @Operation(summary = "Feature C: Company Policy Assistant using Retrieval-Augmented Generation (RAG) with exact citations")
    public ResponseEntity<ApiResponse<PolicyAnswerResult>> askPolicyAssistant(
            @Valid @RequestBody PolicyQuestionRequest request) {
        PolicyAnswerResult result = aiService.askPolicyQuestion(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/onboarding-copilot/ask")
    @Operation(summary = "Feature D: Employee Onboarding Copilot for contextual task explanations and recommendations")
    public ResponseEntity<ApiResponse<CopilotAnswerResult>> askCopilot(
            @Valid @RequestBody CopilotQuestionRequest request) {
        CopilotAnswerResult result = aiService.askCopilot(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
