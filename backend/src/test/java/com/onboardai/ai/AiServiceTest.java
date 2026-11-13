package com.onboardai.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardai.audit.AuditService;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.documents.Document;
import com.onboardai.documents.DocumentRepository;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.policies.CompanyPolicy;
import com.onboardai.policies.PolicyChunk;
import com.onboardai.policies.PolicyService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.CreateTaskRequest;
import com.onboardai.tasks.OnboardingTask;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.tasks.TaskCategory;
import com.onboardai.tasks.TaskPriority;
import com.onboardai.tasks.TaskService;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private AiProviderService aiProvider;

    @Mock
    private AiInteractionRepository interactionRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private OnboardingTaskRepository taskRepository;

    @Mock
    private TaskService taskService;

    @Mock
    private PolicyService policyService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AiService aiService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private UUID orgId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentOrganizationId).thenReturn(orgId);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

        UserPrincipal hrPrincipal = new UserPrincipal(userId, orgId, "Elena Vance", "admin@acme.com", "pass", Role.HR_ADMIN, true);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUser).thenReturn(hrPrincipal);
    }

    @AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
    }

    @Test
    @DisplayName("Document extraction retrieves document with tenant check, saves metadata, and records interaction")
    void testDocumentExtractionSuccess() {
        UUID docId = UUID.randomUUID();
        Document doc = new Document(orgId, UUID.randomUUID(), "TAX_FORM", "W4_Form.pdf", "uuid-w4.pdf", "application/pdf", 1024L, userId);
        doc.setId(docId);

        when(documentRepository.findByIdAndOrganizationId(docId, orgId)).thenReturn(Optional.of(doc));

        DocumentExtractionResult mockResult = new DocumentExtractionResult();
        mockResult.setDocumentType("TAX_FORM");
        mockResult.setCandidateName("Alex Morgan");
        mockResult.setProvider("DEMO_FALLBACK");
        mockResult.setFallback(true);
        mockResult.setConfidence(0.95);
        mockResult.setExtractedFields(Map.of("Filing Status", "Single", "Withholding", "$0.00"));

        when(aiProvider.extractDocumentInfo(eq("TAX_FORM"), eq("W4_Form.pdf"), any())).thenReturn(mockResult);

        DocumentExtractionResult result = aiService.extractDocument(docId);

        assertThat(result).isNotNull();
        assertThat(result.getCandidateName()).isEqualTo("Alex Morgan");
        assertThat(result.isFallback()).isTrue();
        assertThat(result.getProvider()).isEqualTo("DEMO_FALLBACK");
        verify(documentRepository).save(doc);
        verify(interactionRepository).save(any(AiInteraction.class));
    }

    @Test
    @DisplayName("Cross-tenant document extraction is blocked and throws ResourceNotFoundException")
    void testCrossTenantDocumentExtractionBlocked() {
        UUID docId = UUID.randomUUID();
        // Repository returns empty because query is scoped to current tenant orgId
        when(documentRepository.findByIdAndOrganizationId(docId, orgId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiService.extractDocument(docId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Document not found");

        verify(aiProvider, never()).extractDocumentInfo(any(), any(), any());
    }

    @Test
    @DisplayName("Checklist generation produces suggestions without writing to task database")
    void testGenerateChecklistDoesNotDirectlyWriteTasks() {
        UUID empId = UUID.randomUUID();
        Employee emp = new Employee(orgId, null, "EMP-101", "Engineering", "Backend Engineer", null, LocalDate.now());
        emp.setId(empId);

        when(employeeRepository.findByIdAndOrganizationId(empId, orgId)).thenReturn(Optional.of(emp));
        when(taskRepository.findAllByEmployeeId(empId)).thenReturn(Collections.emptyList());

        ChecklistGenerationResult mockResult = new ChecklistGenerationResult();
        mockResult.setEmployeeId(empId);
        mockResult.setRole("Backend Engineer");
        mockResult.setDepartment("Engineering");
        mockResult.setProvider("DEMO_FALLBACK");
        mockResult.setFallback(true);

        ChecklistSuggestionDto suggestion = new ChecklistSuggestionDto(
                "Set Up Local Database",
                "Install PostgreSQL locally and run migrations",
                TaskCategory.IT_SETUP,
                TaskPriority.HIGH,
                2,
                "Required for backend development",
                true,
                false
        );
        mockResult.setSuggestions(List.of(suggestion));

        when(aiProvider.generateChecklist(any(), eq("Backend Engineer"), eq("Engineering"), any(), any()))
                .thenReturn(mockResult);

        ChecklistGenerationRequest request = new ChecklistGenerationRequest();
        request.setEmployeeId(empId);
        request.setAdditionalFocus("Database setup");

        ChecklistGenerationResult result = aiService.generateChecklist(request);

        assertThat(result).isNotNull();
        assertThat(result.getSuggestions()).hasSize(1);
        assertThat(result.getSuggestions().get(0).getTitle()).isEqualTo("Set Up Local Database");

        // CRITICAL SAFEGUARD: Verify LLM output did NOT directly create tasks
        verify(taskService, never()).createTask(any());
        verify(interactionRepository).save(any(AiInteraction.class));
    }

    @Test
    @DisplayName("Approve checklist applies HR-reviewed suggestions through normal TaskService with audit logging")
    void testApproveChecklistCreatesTasksViaTaskService() {
        UUID empId = UUID.randomUUID();
        Employee emp = new Employee(orgId, null, "EMP-101", "Engineering", "Backend Engineer", null, LocalDate.now());
        emp.setId(empId);

        when(employeeRepository.findByIdAndOrganizationId(empId, orgId)).thenReturn(Optional.of(emp));

        ChecklistSuggestionDto suggestion = new ChecklistSuggestionDto(
                "Set Up Local Database",
                "Install PostgreSQL locally and run migrations",
                TaskCategory.IT_SETUP,
                TaskPriority.HIGH,
                2,
                "Required for backend development",
                true,
                false
        );

        ApproveChecklistRequest request = new ApproveChecklistRequest();
        request.setSelectedSuggestions(List.of(suggestion));

        aiService.approveChecklist(empId, request);

        // Verify task was routed through validated TaskService
        verify(taskService).createTask(argThat(req ->
                req.getTitle().equals("Set Up Local Database") &&
                req.getCategory() == TaskCategory.IT_SETUP &&
                req.getPriority() == TaskPriority.HIGH &&
                req.isRequired()
        ));

        // Verify audit event was logged
        verify(auditService).recordAction(eq(orgId), eq(userId), eq("APPROVE_AI_CHECKLIST"), eq("Employee"), eq(empId.toString()), any());
    }

    @Test
    @DisplayName("Policy Q&A performs tenant-scoped chunk retrieval and returns citations")
    void testPolicyQaWithRetrievalAndCitations() {
        CompanyPolicy policy = new CompanyPolicy(orgId, "Annual Leave Policy", "HR_BENEFITS", "Vacation guidelines", "Full text", userId);
        policy.setId(UUID.randomUUID());

        PolicyChunk chunk = new PolicyChunk(orgId, 1, "PTO Allotment", "Employees receive 20 days paid annual leave annually.");
        chunk.setPolicy(policy);
        chunk.setId(UUID.randomUUID());

        when(policyService.searchRelevantChunks(eq(orgId), eq("How many vacation days do I get?"), eq(4)))
                .thenReturn(List.of(chunk));

        PolicyCitationDto citation = new PolicyCitationDto(policy.getId(), policy.getTitle(), chunk.getSectionTitle(), chunk.getContent());
        PolicyAnswerResult mockAnswer = new PolicyAnswerResult();
        mockAnswer.setQuestion("How many vacation days do I get?");
        mockAnswer.setAnswer("Based on Annual Leave Policy, you receive 20 days paid annual leave annually.");
        mockAnswer.setProvider("DEMO_FALLBACK");
        mockAnswer.setFallback(true);
        mockAnswer.setCitations(List.of(citation));

        when(aiProvider.answerPolicyQuestion(eq("How many vacation days do I get?"), any()))
                .thenReturn(mockAnswer);

        PolicyQuestionRequest req = new PolicyQuestionRequest();
        req.setQuestion("How many vacation days do I get?");

        PolicyAnswerResult result = aiService.askPolicyQuestion(req);

        assertThat(result).isNotNull();
        assertThat(result.getAnswer()).contains("20 days paid annual leave");
        assertThat(result.getCitations()).hasSize(1);
        assertThat(result.getCitations().get(0).getPolicyTitle()).isEqualTo("Annual Leave Policy");
        assertThat(result.getCitations().get(0).getSectionTitle()).isEqualTo("PTO Allotment");
        assertThat(result.isFallback()).isTrue();

        verify(interactionRepository).save(any(AiInteraction.class));
    }

    @Test
    @DisplayName("Policy Q&A handles empty search results honestly without hallucinating policies")
    void testPolicyQaEmptyResultsHandledHonestly() {
        when(policyService.searchRelevantChunks(eq(orgId), eq("What is the reimbursement limit?"), eq(4)))
                .thenReturn(Collections.emptyList());

        PolicyAnswerResult fallbackEmptyAnswer = new PolicyAnswerResult();
        fallbackEmptyAnswer.setQuestion("What is the reimbursement limit?");
        fallbackEmptyAnswer.setAnswer("I could not find relevant company policy documents matching your query. Please contact your HR Manager for clarification.");
        fallbackEmptyAnswer.setProvider("DEMO_FALLBACK");
        fallbackEmptyAnswer.setFallback(true);
        fallbackEmptyAnswer.setCitations(Collections.emptyList());

        when(aiProvider.answerPolicyQuestion(eq("What is the reimbursement limit?"), eq(Collections.emptyList())))
                .thenReturn(fallbackEmptyAnswer);

        PolicyQuestionRequest req = new PolicyQuestionRequest();
        req.setQuestion("What is the reimbursement limit?");

        PolicyAnswerResult result = aiService.askPolicyQuestion(req);

        assertThat(result.getCitations()).isEmpty();
        assertThat(result.getAnswer()).contains("could not find relevant company policy documents");
    }
}
