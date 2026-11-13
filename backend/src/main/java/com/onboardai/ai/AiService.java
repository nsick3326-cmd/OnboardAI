package com.onboardai.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.documents.Document;
import com.onboardai.documents.DocumentRepository;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.policies.PolicyChunk;
import com.onboardai.policies.PolicyService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.CreateTaskRequest;
import com.onboardai.tasks.OnboardingTask;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.tasks.TaskService;
import com.onboardai.users.Role;
import com.onboardai.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiProviderService aiProvider;
    private final AiInteractionRepository interactionRepository;
    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository taskRepository;
    private final TaskService taskService;
    private final PolicyService policyService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AiService(
            AiProviderService aiProvider,
            AiInteractionRepository interactionRepository,
            DocumentRepository documentRepository,
            EmployeeRepository employeeRepository,
            OnboardingTaskRepository taskRepository,
            TaskService taskService,
            PolicyService policyService,
            UserRepository userRepository,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.aiProvider = aiProvider;
        this.interactionRepository = interactionRepository;
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.policyService = policyService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DocumentExtractionResult extractDocument(UUID documentId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        Document document = documentRepository.findByIdAndOrganizationId(documentId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        DocumentExtractionResult result = aiProvider.extractDocumentInfo(
                document.getDocumentType(),
                document.getOriginalFilename(),
                "Document Name: " + document.getOriginalFilename() + ", Type: " + document.getDocumentType()
        );

        try {
            document.setExtractedMetadata(objectMapper.writeValueAsString(result.getExtractedFields()));
            documentRepository.save(document);
        } catch (Exception e) {
            log.warn("Could not serialize extracted metadata", e);
        }

        recordInteraction(orgId, userId, "DOCUMENT_EXTRACTION", "documentId: " + documentId,
                result.getSummary(), result.getProvider(), result.isFallback());

        return result;
    }

    @Transactional(readOnly = true)
    public ChecklistGenerationResult generateChecklist(ChecklistGenerationRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(request.getEmployeeId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        String empName = employee.getEmployeeCode();
        if (employee.getUserId() != null) {
            empName = userRepository.findById(employee.getUserId()).map(u -> u.getFullName()).orElse(empName);
        }

        List<String> existingTasks = taskRepository.findAllByEmployeeId(employee.getId())
                .stream().map(OnboardingTask::getTitle).toList();

        ChecklistGenerationResult result = aiProvider.generateChecklist(
                empName,
                employee.getJobTitle(),
                employee.getDepartment(),
                request.getAdditionalFocus(),
                existingTasks
        );
        result.setEmployeeId(employee.getId());

        recordInteraction(orgId, userId, "CHECKLIST_GENERATION", "employee: " + employee.getEmployeeCode(),
                "Suggestions: " + result.getSuggestions().size(), result.getProvider(), result.isFallback());

        return result;
    }

    @Transactional
    public List<OnboardingTask> approveChecklist(UUID employeeId, ApproveChecklistRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID actorUserId = SecurityUtils.getCurrentUserId();

        Employee employee = employeeRepository.findByIdAndOrganizationId(employeeId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        List<OnboardingTask> createdTasks = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (ChecklistSuggestionDto suggestion : request.getSelectedSuggestions()) {
            CreateTaskRequest taskReq = new CreateTaskRequest();
            taskReq.setEmployeeId(employee.getId());
            taskReq.setTitle(suggestion.getTitle());
            taskReq.setDescription(suggestion.getDescription() + " (Rationale: " + suggestion.getRationale() + ")");
            taskReq.setCategory(suggestion.getCategory());
            taskReq.setPriority(suggestion.getPriority());
            taskReq.setDueDate(today.plusDays(suggestion.getRelativeDueDays()));
            taskReq.setRequired(suggestion.isRequired());
            taskReq.setDocumentRequired(suggestion.isDocumentRequired());

            taskService.createTask(taskReq);
        }

        auditService.recordAction(orgId, actorUserId, "APPROVE_AI_CHECKLIST", "Employee", employee.getId().toString(),
                "Approved " + request.getSelectedSuggestions().size() + " AI checklist suggestions");

        return taskRepository.findAllByEmployeeId(employee.getId());
    }

    @Transactional(readOnly = true)
    public PolicyAnswerResult askPolicyQuestion(PolicyQuestionRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        List<PolicyChunk> chunks = policyService.searchRelevantChunks(orgId, request.getQuestion(), 4);

        List<PolicyCitationDto> citations = new ArrayList<>();
        for (PolicyChunk chunk : chunks) {
            String policyTitle = chunk.getPolicy() != null ? chunk.getPolicy().getTitle() : "Company Policy";
            UUID policyId = chunk.getPolicy() != null ? chunk.getPolicy().getId() : null;
            citations.add(new PolicyCitationDto(policyId, policyTitle, chunk.getSectionTitle(), chunk.getContent()));
        }

        PolicyAnswerResult result = aiProvider.answerPolicyQuestion(request.getQuestion(), citations);

        recordInteraction(orgId, userId, "POLICY_QA", "query: " + request.getQuestion(),
                "Citations: " + citations.size(), result.getProvider(), result.isFallback());

        return result;
    }

    @Transactional(readOnly = true)
    public CopilotAnswerResult askCopilot(CopilotQuestionRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        String employeeContext = currentUser.getFullName() + " (" + currentUser.getRole() + ")";
        String taskContext = "";
        List<String> pendingTasks = new ArrayList<>();

        if (currentUser.getRole() == Role.EMPLOYEE) {
            Optional<Employee> empOpt = employeeRepository.findByUserId(currentUser.getId());
            if (empOpt.isPresent()) {
                Employee emp = empOpt.get();
                employeeContext = emp.getJobTitle() + " in " + emp.getDepartment() + " (Status: " + emp.getOnboardingStatus() + ")";
                pendingTasks = taskRepository.findAllByEmployeeId(emp.getId())
                        .stream()
                        .filter(t -> t.getStatus() != com.onboardai.tasks.TaskStatus.COMPLETED)
                        .map(t -> t.getTitle() + " [Due: " + t.getDueDate() + "]")
                        .limit(5)
                        .toList();
            }
        }

        if (request.getTaskId() != null) {
            Optional<OnboardingTask> task = taskRepository.findByIdAndOrganizationId(request.getTaskId(), orgId);
            if (task.isPresent()) {
                taskContext = task.get().getTitle() + " - " + task.get().getDescription();
            }
        }

        CopilotAnswerResult result = aiProvider.answerCopilotQuestion(request.getQuestion(), taskContext, employeeContext, pendingTasks);

        recordInteraction(orgId, currentUser.getId(), "ONBOARDING_COPILOT", "query: " + request.getQuestion(),
                result.getAnswer(), result.getProvider(), result.isFallback());

        return result;
    }

    private void recordInteraction(UUID orgId, UUID userId, String feature, String reqMeta, String resMeta, String provider, boolean fallback) {
        try {
            AiInteraction interaction = new AiInteraction(
                    orgId,
                    userId,
                    feature,
                    reqMeta,
                    resMeta != null && resMeta.length() > 500 ? resMeta.substring(0, 497) + "..." : resMeta,
                    provider,
                    fallback,
                    "SUCCESS"
            );
            interactionRepository.save(interaction);
        } catch (Exception e) {
            log.warn("Failed to persist AI interaction telemetry", e);
        }
    }
}
