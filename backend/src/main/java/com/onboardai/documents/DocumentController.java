package com.onboardai.documents;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Documents", description = "Endpoints for secure document upload, download, and verification workflows")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/employees/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document for an employee")
    public ResponseEntity<ApiResponse<DocumentDto>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file) {
        DocumentDto uploaded = documentService.uploadDocument(id, documentType, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Document uploaded successfully", uploaded));
    }

    @GetMapping("/employees/{id}/documents")
    @Operation(summary = "Get list of all documents uploaded for an employee")
    public ResponseEntity<ApiResponse<List<DocumentDto>>> getEmployeeDocuments(@PathVariable UUID id) {
        List<DocumentDto> docs = documentService.getEmployeeDocuments(id);
        return ResponseEntity.ok(ApiResponse.ok(docs));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Get all documents in the organization with pagination and status filtering")
    public ResponseEntity<ApiResponse<PagedResponse<DocumentDto>>> getAllDocuments(
            @RequestParam(required = false) DocumentVerificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        Page<DocumentDto> docs = documentService.getAllDocuments(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(docs)));
    }

    @GetMapping("/documents/{id}")
    @Operation(summary = "Get document metadata by ID")
    public ResponseEntity<ApiResponse<DocumentDto>> getDocumentById(@PathVariable UUID id) {
        DocumentDto doc = documentService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok(doc));
    }

    @GetMapping("/documents/{id}/download")
    @Operation(summary = "Download stored document binary stream")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID id) {
        DocumentDto doc = documentService.getDocumentById(id);
        Resource fileResource = documentService.downloadDocument(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .body(fileResource);
    }

    @PostMapping("/documents/{id}/verify")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Approve and verify an uploaded document")
    public ResponseEntity<ApiResponse<DocumentDto>> verifyDocument(@PathVariable UUID id) {
        DocumentDto verified = documentService.verifyDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document verified successfully", verified));
    }

    @PostMapping("/documents/{id}/reject")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Reject an uploaded document with reason")
    public ResponseEntity<ApiResponse<DocumentDto>> rejectDocument(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        DocumentDto rejected = documentService.rejectDocument(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Document rejected", rejected));
    }
}
