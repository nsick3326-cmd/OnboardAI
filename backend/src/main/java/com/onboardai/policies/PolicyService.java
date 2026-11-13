package com.onboardai.policies;

import com.onboardai.audit.AuditService;
import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final PolicyChunkRepository chunkRepository;
    private final AuditService auditService;

    public PolicyService(PolicyRepository policyRepository, PolicyChunkRepository chunkRepository, AuditService auditService) {
        this.policyRepository = policyRepository;
        this.chunkRepository = chunkRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<PolicyDto> getPolicies(Pageable pageable) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        return policyRepository.findAllByOrganizationId(orgId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PolicyDto getPolicyById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        CompanyPolicy policy = policyRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyPolicy", "id", id));
        return toDto(policy);
    }

    @Transactional
    public PolicyDto createPolicy(CreatePolicyRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        CompanyPolicy policy = new CompanyPolicy(
                orgId,
                request.getTitle().trim(),
                request.getCategory(),
                request.getDescription(),
                request.getContent().trim(),
                userId
        );

        List<PolicyChunk> chunks = chunkPolicyText(orgId, policy.getTitle(), policy.getContent());
        for (PolicyChunk chunk : chunks) {
            policy.addChunk(chunk);
        }

        policy = policyRepository.save(policy);

        auditService.recordAction(orgId, userId, "CREATE_POLICY", "CompanyPolicy", policy.getId().toString(),
                "Created policy '" + policy.getTitle() + "' with " + chunks.size() + " RAG chunks");

        return toDto(policy);
    }

    @Transactional
    public PolicyDto publishPolicy(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId();
        UUID userId = SecurityUtils.getCurrentUserId();

        CompanyPolicy policy = policyRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyPolicy", "id", id));

        policy.setStatus("PUBLISHED");
        policy = policyRepository.save(policy);

        auditService.recordAction(orgId, userId, "PUBLISH_POLICY", "CompanyPolicy", policy.getId().toString(),
                "Published policy: " + policy.getTitle());

        return toDto(policy);
    }

    @Transactional(readOnly = true)
    public List<PolicyChunk> searchRelevantChunks(UUID organizationId, String query, int maxResults) {
        List<PolicyChunk> allPublished = chunkRepository.findAllPublishedChunksByOrganizationId(organizationId);
        if (allPublished.isEmpty() || query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        Set<String> stopWords = Set.of(
                "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "for", "of", "or", "by",
                "with", "from", "as", "about", "into", "through", "during", "before", "after", "above",
                "below", "what", "how", "when", "where", "who", "why", "can", "will", "does", "do",
                "did", "have", "has", "had", "would", "should", "could", "company", "policy", "policies",
                "rules", "rule", "guidelines", "regarding", "please", "tell", "show", "many", "much"
        );

        // Lexical BM25-style keyword matching and TF scoring with section boosting
        String[] queryTerms = query.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .split("\\s+");
        Set<String> searchTerms = Arrays.stream(queryTerms)
                .filter(term -> term.length() > 2 && !stopWords.contains(term))
                .collect(Collectors.toSet());

        if (searchTerms.isEmpty()) {
            return Collections.emptyList();
        }

        Map<PolicyChunk, Integer> scoredChunks = new HashMap<>();

        for (PolicyChunk chunk : allPublished) {
            int score = 0;
            String lowerContent = chunk.getContent().toLowerCase();
            String lowerTitle = chunk.getSectionTitle() != null ? chunk.getSectionTitle().toLowerCase() : "";
            String policyTitle = chunk.getPolicy() != null ? chunk.getPolicy().getTitle().toLowerCase() : "";

            for (String term : searchTerms) {
                // Section and policy title matches carry higher weight
                if (lowerTitle.contains(term)) {
                    score += 5;
                }
                if (policyTitle.contains(term)) {
                    score += 4;
                }
                // Content occurrences
                int index = 0;
                while ((index = lowerContent.indexOf(term, index)) != -1) {
                    score += 1;
                    index += term.length();
                }
            }

            if (score >= 2) {
                scoredChunks.put(chunk, score);
            }
        }

        return scoredChunks.entrySet().stream()
                .sorted(Map.Entry.<PolicyChunk, Integer>comparingByValue().reversed())
                .limit(maxResults)
                .map(Map.Entry::getKey)
                .toList();
    }

    public List<PolicyChunk> chunkPolicyText(UUID organizationId, String policyTitle, String text) {
        List<PolicyChunk> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }

        // Split by markdown headers or double newlines
        String[] sections = text.split("(?=(?:^|\\n)#{1,3}\\s+)");
        int chunkIdx = 0;

        for (String section : sections) {
            String trimmed = section.trim();
            if (trimmed.isEmpty()) continue;

            String sectionTitle = policyTitle;
            if (trimmed.startsWith("#")) {
                int firstNewline = trimmed.indexOf('\n');
                if (firstNewline > 0) {
                    sectionTitle = trimmed.substring(0, firstNewline).replace("#", "").trim();
                } else {
                    sectionTitle = trimmed.replace("#", "").trim();
                }
            }

            // If section is reasonably sized (under 1000 chars), keep as one chunk
            if (trimmed.length() <= 1200) {
                chunks.add(new PolicyChunk(organizationId, chunkIdx++, sectionTitle, trimmed));
            } else {
                // Sub-chunk into paragraphs of roughly 800 chars
                String[] paragraphs = trimmed.split("\\n\\s*\\n");
                StringBuilder currentChunk = new StringBuilder();

                for (String para : paragraphs) {
                    if (currentChunk.length() + para.length() > 1000 && currentChunk.length() > 0) {
                        chunks.add(new PolicyChunk(organizationId, chunkIdx++, sectionTitle, currentChunk.toString().trim()));
                        currentChunk = new StringBuilder();
                    }
                    currentChunk.append(para).append("\n\n");
                }
                if (currentChunk.length() > 0) {
                    chunks.add(new PolicyChunk(organizationId, chunkIdx++, sectionTitle, currentChunk.toString().trim()));
                }
            }
        }

        if (chunks.isEmpty()) {
            chunks.add(new PolicyChunk(organizationId, 0, policyTitle, text.trim()));
        }

        return chunks;
    }

    private PolicyDto toDto(CompanyPolicy policy) {
        PolicyDto dto = new PolicyDto();
        dto.setId(policy.getId());
        dto.setOrganizationId(policy.getOrganizationId());
        dto.setTitle(policy.getTitle());
        dto.setCategory(policy.getCategory());
        dto.setDescription(policy.getDescription());
        dto.setContent(policy.getContent());
        dto.setStatus(policy.getStatus());
        dto.setUploadedBy(policy.getUploadedBy());
        dto.setChunkCount(policy.getChunks() != null ? policy.getChunks().size() : 0);
        dto.setCreatedAt(policy.getCreatedAt());
        return dto;
    }
}
