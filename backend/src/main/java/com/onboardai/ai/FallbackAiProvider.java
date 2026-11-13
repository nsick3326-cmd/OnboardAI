package com.onboardai.ai;

import com.onboardai.tasks.TaskCategory;
import com.onboardai.tasks.TaskPriority;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

@Component
public class FallbackAiProvider implements AiProviderService {

    private static final String PROVIDER_NAME = "DEMO_FALLBACK (Offline Synthetic Adapter)";

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public DocumentExtractionResult extractDocumentInfo(String documentType, String filename, String textPreview) {
        DocumentExtractionResult result = new DocumentExtractionResult();
        result.setDocumentType(documentType != null ? documentType : "ID_PROOF");
        result.setProvider(PROVIDER_NAME);
        result.setFallback(true);
        result.setConfidence(0.92);

        Map<String, String> fields = new LinkedHashMap<>();

        if ("ID_PROOF".equalsIgnoreCase(documentType) || "PASSPORT".equalsIgnoreCase(documentType) || filename.toLowerCase().contains("passport") || filename.toLowerCase().contains("id")) {
            result.setCandidateName("Alex Morgan");
            result.setInstitutionOrEmployer("Government Authority / Dept of State");
            result.setDocumentNumber("USA-94827104B");
            result.setIssueDate(LocalDate.now().minusYears(3).toString());
            result.setExpirationDate(LocalDate.now().plusYears(7).toString());
            result.setSummary("Document verified as valid government-issued photographic identity card.");
            fields.put("Document Category", "National Identity / Passport");
            fields.put("Country of Issue", "United States");
            fields.put("Date of Birth", "1994-08-16");
            fields.put("Verification Checksum", "VALID_CRC32");
        } else if ("TAX_FORM".equalsIgnoreCase(documentType) || "W4".equalsIgnoreCase(documentType) || filename.toLowerCase().contains("tax") || filename.toLowerCase().contains("w4")) {
            result.setCandidateName("Alex Morgan");
            result.setInstitutionOrEmployer("Internal Revenue Service / Treasury");
            result.setDocumentNumber("W4-2026-REV");
            result.setIssueDate(LocalDate.now().minusDays(14).toString());
            result.setExpirationDate("N/A (Annual Withholding)");
            result.setSummary("Standard Employee Withholding Certificate (W-4) completed with single filing status.");
            fields.put("Tax Filing Status", "Single");
            fields.put("Multiple Jobs / Spouse Works", "No");
            fields.put("Claim Dependents Amount", "$0.00");
            fields.put("Exempt Status", "Not Exempt");
        } else if ("OFFER_LETTER".equalsIgnoreCase(documentType) || "CONTRACT".equalsIgnoreCase(documentType) || filename.toLowerCase().contains("offer")) {
            result.setCandidateName("Alex Morgan");
            result.setInstitutionOrEmployer("Acme Corporation");
            result.setDocumentNumber("OFFER-2026-ENG");
            result.setIssueDate(LocalDate.now().minusMonths(1).toString());
            result.setExpirationDate(LocalDate.now().plusYears(1).toString());
            result.setSummary("Signed Employment Agreement & Offer Letter confirming role, compensation, and start date.");
            fields.put("Agreed Position", "Senior Software Engineer");
            fields.put("Department", "Engineering");
            fields.put("Work Location", "Hybrid / Remote");
            fields.put("Signature Status", "Executed & Countersigned");
        } else {
            result.setCandidateName("Alex Morgan");
            result.setInstitutionOrEmployer("Acme Enterprise Verification");
            result.setDocumentNumber("DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            result.setIssueDate(LocalDate.now().minusDays(5).toString());
            result.setExpirationDate("N/A");
            result.setSummary("General onboarding verification record processed successfully.");
            fields.put("Processed Format", "Digital Document");
            fields.put("Field Validation", "Standard Compliant");
        }

        result.setExtractedFields(fields);
        return result;
    }

    @Override
    public ChecklistGenerationResult generateChecklist(String employeeName, String role, String department, String focus, List<String> existingTasks) {
        ChecklistGenerationResult result = new ChecklistGenerationResult();
        result.setEmployeeName(employeeName);
        result.setRole(role);
        result.setDepartment(department);
        result.setProvider(PROVIDER_NAME);
        result.setFallback(true);

        List<ChecklistSuggestionDto> suggestions = new ArrayList<>();

        String cleanRole = role != null ? role.toLowerCase() : "";
        String cleanDept = department != null ? department.toLowerCase() : "";

        if (cleanDept.contains("eng") || cleanRole.contains("eng") || cleanRole.contains("developer") || cleanRole.contains("software")) {
            suggestions.add(new ChecklistSuggestionDto(
                    "Clone Core Repositories & Verify Local Build",
                    "Configure SSH keys for GitHub Enterprise, clone the primary microservices repositories, and complete standard build setup.",
                    TaskCategory.IT_SETUP,
                    TaskPriority.HIGH,
                    3,
                    "Essential for software engineering productivity during week 1.",
                    true,
                    false
            ));
            suggestions.add(new ChecklistSuggestionDto(
                    "Architecture Overview & Engineering Standards Briefing",
                    "Schedule a 45-minute 1-on-1 walk-through with Tech Lead to understand CI/CD pipelines and coding guidelines.",
                    TaskCategory.TRAINING,
                    TaskPriority.MEDIUM,
                    5,
                    "Ensures alignment with system architecture and security scanning standards.",
                    true,
                    false
            ));
            suggestions.add(new ChecklistSuggestionDto(
                    "Complete Development Environment Security Hardening",
                    "Enable disk encryption (BitLocker/FileVault), configure 2FA on IDE plugins, and verify VPN certificates.",
                    TaskCategory.COMPLIANCE,
                    TaskPriority.HIGH,
                    2,
                    "Mandatory ISO 27001 IT compliance control for all engineering workstations.",
                    true,
                    false
            ));
        } else if (cleanDept.contains("product") || cleanRole.contains("product") || cleanRole.contains("design")) {
            suggestions.add(new ChecklistSuggestionDto(
                    "Access Product Workspace (Figma, Jira, Notion)",
                    "Activate enterprise SSO seats for product roadmap tools, design libraries, and user research repositories.",
                    TaskCategory.IT_SETUP,
                    TaskPriority.HIGH,
                    2,
                    "Required for participation in sprint planning and design hand-offs.",
                    true,
                    false
            ));
            suggestions.add(new ChecklistSuggestionDto(
                    "Customer Persona & Product Vision Immersion",
                    "Review Q3/Q4 strategy decks and customer feedback recordings to align on target personas.",
                    TaskCategory.TRAINING,
                    TaskPriority.MEDIUM,
                    4,
                    "Accelerates domain understanding for new product team members.",
                    false,
                    false
            ));
        } else {
            suggestions.add(new ChecklistSuggestionDto(
                    "Departmental Workflow Orientation",
                    "Meet with department manager to review operational rhythm, weekly standups, and departmental goals.",
                    TaskCategory.HR_MEETING,
                    TaskPriority.HIGH,
                    3,
                    "Core team alignment task for " + department + " role.",
                    true,
                    false
            ));
            suggestions.add(new ChecklistSuggestionDto(
                    "Review Role-Specific Tooling & Knowledge Base",
                    "Complete self-guided review of internal team manuals and standard operating procedures.",
                    TaskCategory.TRAINING,
                    TaskPriority.MEDIUM,
                    5,
                    "Builds baseline domain autonomy during initial onboarding phase.",
                    false,
                    false
            ));
        }

        suggestions.add(new ChecklistSuggestionDto(
                "Submit Direct Deposit & Payroll Enrollment",
                "Upload voided check or official direct deposit authorization letter for monthly payroll processing.",
                TaskCategory.DOCUMENTATION,
                TaskPriority.HIGH,
                4,
                "Ensures timely compensation processing for the first payroll cycle.",
                true,
                true
        ));

        result.setSuggestions(suggestions);
        return result;
    }

    @Override
    public PolicyAnswerResult answerPolicyQuestion(String question, List<PolicyCitationDto> citations) {
        PolicyAnswerResult result = new PolicyAnswerResult();
        result.setQuestion(question);
        result.setProvider(PROVIDER_NAME);
        result.setFallback(true);
        result.setCitations(citations);

        if (citations == null || citations.isEmpty()) {
            result.setAnswer("I could not find relevant company policy documents matching your query. Please contact your HR Manager for clarification.");
            return result;
        }

        // Construct grounded synthesis quoting the highest scored chunk
        PolicyCitationDto primary = citations.get(0);
        StringBuilder sb = new StringBuilder();
        sb.append("Based on company policy **").append(primary.getPolicyTitle()).append("**");
        if (primary.getSectionTitle() != null && !primary.getSectionTitle().isBlank()) {
            sb.append(" (Section: *").append(primary.getSectionTitle()).append("*)");
        }
        sb.append(":\n\n");

        // Format clean excerpt
        String snippet = primary.getSnippet().trim();
        if (snippet.length() > 400) {
            snippet = snippet.substring(0, 397) + "...";
        }
        sb.append("> \"").append(snippet).append("\"\n\n");
        sb.append("If you have specific exceptions or require manager approval, please initiate a request in the Approvals tab.");

        result.setAnswer(sb.toString());
        return result;
    }

    @Override
    public CopilotAnswerResult answerCopilotQuestion(String question, String taskContext, String employeeContext, List<String> pendingTasks) {
        CopilotAnswerResult result = new CopilotAnswerResult();
        result.setQuestion(question);
        result.setProvider(PROVIDER_NAME);
        result.setFallback(true);

        StringBuilder sb = new StringBuilder();
        sb.append("Hello! Here is your onboarding guidance:\n\n");

        if (taskContext != null && !taskContext.isBlank()) {
            sb.append("**Regarding your selected task:** ").append(taskContext).append("\n\n");
            sb.append("Make sure all required documents are attached before marking this task as complete. ");
        }

        if (pendingTasks != null && !pendingTasks.isEmpty()) {
            sb.append("You currently have ").append(pendingTasks.size()).append(" pending task(s). ");
            sb.append("I recommend tackling high-priority IT and compliance setup tasks first so you have all credentials ready.\n\n");
        } else {
            sb.append("You are in great shape with all current onboarding checkpoints!\n\n");
        }

        List<String> nextSteps = new ArrayList<>();
        nextSteps.add("Complete your pending identity and tax documentation");
        nextSteps.add("Schedule week-1 check-in with your assigned manager");
        nextSteps.add("Explore the Company Policies tab to learn about benefits and leave policies");

        result.setAnswer(sb.toString().trim());
        result.setSuggestedNextSteps(nextSteps);
        return result;
    }
}
