package com.onboardai.approvals;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.documents.Document;
import com.onboardai.documents.DocumentRepository;
import com.onboardai.documents.DocumentVerificationStatus;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.notifications.NotificationService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.tasks.OnboardingTask;
import com.onboardai.tasks.OnboardingTaskRepository;
import com.onboardai.users.Role;
import com.onboardai.users.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ApprovalService {

    private final ApprovalRepository approvalRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentRepository documentRepository;
    private final OnboardingTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ApprovalService(
            ApprovalRepository approvalRepository,
            EmployeeRepository employeeRepository,
            DocumentRepository documentRepository,
            OnboardingTaskRepository taskRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditService auditService) {
        this.approvalRepository = approvalRepository;
        this.employeeRepository = employeeRepository;
        this.documentRepository = documentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ApprovalDto> getApprovals(ApprovalStatus status, Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();

        Page<Approval> approvals;
        if (currentUser.getRole() == Role.HR_ADMIN || currentUser.getRole() == Role.HR_MANAGER) {
            if (status != null) {
                approvals = approvalRepository.findAllByOrganizationIdAndStatus(orgId, status, pageable);
            } else {
                approvals = approvalRepository.findAllByOrganizationId(orgId, pageable);
            }
        } else {
            // Manager or designated approver sees approvals directed to them
            approvals = approvalRepository.findAllByOrganizationIdAndApproverId(orgId, currentUser.getId(), pageable);
        }

        return approvals.map(this::toDto);
    }

    @Transactional
    public ApprovalDto approve(UUID id, String comments) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        Approval approval = approvalRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Approval", "id", id));

        validateApproverAccess(approval);

        approval.setStatus(ApprovalStatus.APPROVED);
        approval.setComments(comments);
        approval.setDecisionAt(Instant.now());
        approval = approvalRepository.save(approval);

        // If related to a document, mark document verified
        if (approval.getRelatedDocumentId() != null) {
            documentRepository.findById(approval.getRelatedDocumentId()).ifPresent(doc -> {
                doc.setVerificationStatus(DocumentVerificationStatus.VERIFIED);
                doc.setVerifiedBy(userId);
                doc.setVerifiedAt(Instant.now());
                documentRepository.save(doc);
            });
        }

        Employee emp = employeeRepository.findById(approval.getEmployeeId()).orElse(null);
        if (emp != null && emp.getUserId() != null) {
            notificationService.createNotification(
                    orgId,
                    emp.getUserId(),
                    "Approval Granted",
                    "Your pending approval item has been approved.",
                    "APPROVAL",
                    "/dashboard/approvals"
            );
        }

        auditService.recordAction(orgId, userId, "APPROVE_ITEM", "Approval", approval.getId().toString(),
                "Approved item for employee: " + (emp != null ? emp.getEmployeeCode() : "N/A"));

        return toDto(approval);
    }

    @Transactional
    public ApprovalDto reject(UUID id, String comments) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        if (comments == null || comments.isBlank()) {
            throw new BusinessRuleException("Rejection comments are required");
        }

        Approval approval = approvalRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Approval", "id", id));

        validateApproverAccess(approval);

        approval.setStatus(ApprovalStatus.REJECTED);
        approval.setComments(comments.trim());
        approval.setDecisionAt(Instant.now());
        approval = approvalRepository.save(approval);

        if (approval.getRelatedDocumentId() != null) {
            documentRepository.findById(approval.getRelatedDocumentId()).ifPresent(doc -> {
                doc.setVerificationStatus(DocumentVerificationStatus.REJECTED);
                doc.setRejectionReason(comments.trim());
                doc.setVerifiedBy(userId);
                doc.setVerifiedAt(Instant.now());
                documentRepository.save(doc);
            });
        }

        Employee emp = employeeRepository.findById(approval.getEmployeeId()).orElse(null);
        if (emp != null && emp.getUserId() != null) {
            notificationService.createNotification(
                    orgId,
                    emp.getUserId(),
                    "Approval Rejected",
                    "Your approval request was rejected: " + comments,
                    "APPROVAL",
                    "/dashboard/approvals"
            );
        }

        auditService.recordAction(orgId, userId, "REJECT_ITEM", "Approval", approval.getId().toString(),
                "Rejected item for employee: " + (emp != null ? emp.getEmployeeCode() : "N/A") + ". Reason: " + comments);

        return toDto(approval);
    }

    private void validateApproverAccess(Approval approval) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.getRole() == Role.HR_ADMIN || currentUser.getRole() == Role.HR_MANAGER) {
            return;
        }

        if (approval.getApproverId() != null && approval.getApproverId().equals(currentUser.getId())) {
            return;
        }

        throw new UnauthorizedException("You do not have permission to act on this approval");
    }

    private ApprovalDto toDto(Approval approval) {
        ApprovalDto dto = new ApprovalDto();
        dto.setId(approval.getId());
        dto.setOrganizationId(approval.getOrganizationId());
        dto.setEmployeeId(approval.getEmployeeId());
        dto.setRelatedDocumentId(approval.getRelatedDocumentId());
        dto.setTaskId(approval.getTaskId());
        dto.setRequestedBy(approval.getRequestedBy());
        dto.setApproverId(approval.getApproverId());
        dto.setStatus(approval.getStatus());
        dto.setComments(approval.getComments());
        dto.setDecisionAt(approval.getDecisionAt());
        dto.setCreatedAt(approval.getCreatedAt());

        employeeRepository.findById(approval.getEmployeeId()).ifPresent(e -> dto.setEmployeeName(e.getEmployeeCode()));
        userRepository.findById(approval.getRequestedBy()).ifPresent(u -> dto.setRequestedByName(u.getFullName()));

        if (approval.getApproverId() != null) {
            userRepository.findById(approval.getApproverId()).ifPresent(u -> dto.setApproverName(u.getFullName()));
        }

        if (approval.getRelatedDocumentId() != null) {
            documentRepository.findById(approval.getRelatedDocumentId()).ifPresent(d -> dto.setDocumentName(d.getOriginalFilename()));
        }

        if (approval.getTaskId() != null) {
            taskRepository.findById(approval.getTaskId()).ifPresent(t -> dto.setTaskTitle(t.getTitle()));
        }

        return dto;
    }
}
