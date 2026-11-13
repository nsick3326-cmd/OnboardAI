package com.onboardai.ai;

import java.util.List;

public interface AiProviderService {

    boolean isAvailable();

    String getProviderName();

    DocumentExtractionResult extractDocumentInfo(String documentType, String filename, String textPreview);

    ChecklistGenerationResult generateChecklist(String employeeName, String role, String department, String focus, List<String> existingTasks);

    PolicyAnswerResult answerPolicyQuestion(String question, List<PolicyCitationDto> citations);

    CopilotAnswerResult answerCopilotQuestion(String question, String taskContext, String employeeContext, List<String> pendingTasks);
}
