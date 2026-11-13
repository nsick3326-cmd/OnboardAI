package com.onboardai.documents;

import com.onboardai.audit.AuditService;
import com.onboardai.common.BusinessRuleException;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.common.UnauthorizedException;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.notifications.NotificationService;
import com.onboardai.security.SecurityUtils;
import com.onboardai.security.UserPrincipal;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;

@Service
public class DocumentService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public DocumentService(
            DocumentRepository documentRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            StorageService storageService,
            NotificationService notificationService,
            AuditService auditService) {
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public DocumentDto uploadDocument(UUID employeeId, String documentType, MultipartFile file) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        if (file.isEmpty()) {
            throw new BusinessRuleException("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("File size exceeds maximum permitted limit of 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Unsupported file type. Allowed: PDF, PNG, JPG, TXT, DOCX");
        }

        Employee employee = employeeRepository.findByIdAndOrganizationId(employeeId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        validateEmployeeAccess(employee);

        String storedFilename = storageService.store(file);

        Document document = new Document(
                orgId,
                employee.getId(),
                documentType != null ? documentType.trim() : "GENERAL",
                file.getOriginalFilename(),
                storedFilename,
                contentType,
                file.getSize(),
                userId
        );

        document = documentRepository.save(document);

        // Notify HR managers
        List<User> hrUsers = userRepository.findAllByOrganizationIdAndRole(orgId, Role.HR_ADMIN);
        for (User hr : hrUsers) {
            notificationService.createNotification(
                    orgId,
                    hr.getId(),
                    "Document Uploaded for Verification",
                    "New " + document.getDocumentType() + " uploaded for " + employee.getEmployeeCode(),
                    "DOCUMENT",
                    "/dashboard/documents"
            );
        }

        auditService.recordAction(orgId, userId, "UPLOAD_DOCUMENT", "Document", document.getId().toString(),
                "Uploaded document: " + document.getOriginalFilename() + " for employee " + employee.getEmployeeCode());

        return toDto(document, employee);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getEmployeeDocuments(UUID employeeId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Employee employee = employeeRepository.findByIdAndOrganizationId(employeeId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        validateEmployeeAccess(employee);

        return documentRepository.findAllByOrganizationIdAndEmployeeIdOrderByCreatedAtDesc(orgId, employee.getId())
                .stream()
                .map(doc -> toDto(doc, employee))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DocumentDto> getAllDocuments(DocumentVerificationStatus status, Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Page<Document> docs;
        if (status != null) {
            docs = documentRepository.findAllByOrganizationIdAndVerificationStatus(orgId, status, pageable);
        } else {
            docs = documentRepository.findAllByOrganizationId(orgId, pageable);
        }

        return docs.map(doc -> {
            Employee emp = employeeRepository.findById(doc.getEmployeeId()).orElse(null);
            return toDto(doc, emp);
        });
    }

    @Transactional(readOnly = true)
    public DocumentDto getDocumentById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Document document = documentRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        Employee emp = employeeRepository.findById(document.getEmployeeId()).orElse(null);
        if (emp != null) {
            validateEmployeeAccess(emp);
        }

        return toDto(document, emp);
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        Document document = documentRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        Employee emp = employeeRepository.findById(document.getEmployeeId()).orElse(null);
        if (emp != null) {
            validateEmployeeAccess(emp);
        }

        return storageService.loadAsResource(document.getStoredFilename());
    }

    @Transactional
    public DocumentDto verifyDocument(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        Document document = documentRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        document.setVerificationStatus(DocumentVerificationStatus.VERIFIED);
        document.setVerifiedBy(userId);
        document.setVerifiedAt(Instant.now());
        document.setRejectionReason(null);

        document = documentRepository.save(document);

        Employee emp = employeeRepository.findById(document.getEmployeeId()).orElse(null);
        if (emp != null && emp.getUserId() != null) {
            notificationService.createNotification(
                    orgId,
                    emp.getUserId(),
                    "Document Verified",
                    "Your document '" + document.getOriginalFilename() + "' has been approved and verified.",
                    "DOCUMENT",
                    "/dashboard/documents"
            );
        }

        auditService.recordAction(orgId, userId, "VERIFY_DOCUMENT", "Document", document.getId().toString(),
                "Verified document: " + document.getOriginalFilename());

        return toDto(document, emp);
    }

    @Transactional
    public DocumentDto rejectDocument(UUID id, String rejectionReason) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new BusinessRuleException("Rejection reason must be provided");
        }

        Document document = documentRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        document.setVerificationStatus(DocumentVerificationStatus.REJECTED);
        document.setVerifiedBy(userId);
        document.setVerifiedAt(Instant.now());
        document.setRejectionReason(rejectionReason.trim());

        document = documentRepository.save(document);

        Employee emp = employeeRepository.findById(document.getEmployeeId()).orElse(null);
        if (emp != null && emp.getUserId() != null) {
            notificationService.createNotification(
                    orgId,
                    emp.getUserId(),
                    "Document Rejected",
                    "Your document '" + document.getOriginalFilename() + "' was rejected: " + rejectionReason,
                    "DOCUMENT",
                    "/dashboard/documents"
            );
        }

        auditService.recordAction(orgId, userId, "REJECT_DOCUMENT", "Document", document.getId().toString(),
                "Rejected document: " + document.getOriginalFilename() + ". Reason: " + rejectionReason);

        return toDto(document, emp);
    }

    private void validateEmployeeAccess(Employee employee) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.getRole() == Role.HR_ADMIN || currentUser.getRole() == Role.HR_MANAGER) {
            return;
        }

        if (currentUser.getRole() == Role.EMPLOYEE) {
            if (employee.getUserId() == null || !employee.getUserId().equals(currentUser.getId())) {
                throw new UnauthorizedException("You are only permitted to access your own documents");
            }
            return;
        }

        if (currentUser.getRole() == Role.MANAGER) {
            Optional<Employee> mgr = employeeRepository.findByUserId(currentUser.getId());
            if (mgr.isEmpty() || !mgr.get().getId().equals(employee.getManagerId())) {
                throw new UnauthorizedException("You are not authorized to access documents for this employee");
            }
        }
    }

    private DocumentDto toDto(Document doc, Employee emp) {
        DocumentDto dto = new DocumentDto();
        dto.setId(doc.getId());
        dto.setOrganizationId(doc.getOrganizationId());
        dto.setEmployeeId(doc.getEmployeeId());
        dto.setDocumentType(doc.getDocumentType());
        dto.setOriginalFilename(doc.getOriginalFilename());
        dto.setContentType(doc.getContentType());
        dto.setFileSize(doc.getFileSize());
        dto.setVerificationStatus(doc.getVerificationStatus());
        dto.setRejectionReason(doc.getRejectionReason());
        dto.setExtractedMetadata(doc.getExtractedMetadata());
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setVerifiedBy(doc.getVerifiedBy());
        dto.setVerifiedAt(doc.getVerifiedAt());
        dto.setCreatedAt(doc.getCreatedAt());

        if (emp != null) {
            dto.setEmployeeName(emp.getEmployeeCode());
        }

        userRepository.findById(doc.getUploadedBy()).ifPresent(u -> {
            dto.setUploadedByName(u.getFullName());
        });

        return dto;
    }
}
