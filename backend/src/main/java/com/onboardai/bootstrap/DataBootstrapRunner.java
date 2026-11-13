package com.onboardai.bootstrap;

import com.onboardai.approvals.Approval;
import com.onboardai.approvals.ApprovalRepository;
import com.onboardai.approvals.ApprovalStatus;
import com.onboardai.audit.AuditService;
import com.onboardai.documents.Document;
import com.onboardai.documents.DocumentRepository;
import com.onboardai.documents.DocumentVerificationStatus;
import com.onboardai.employees.Employee;
import com.onboardai.employees.EmployeeRepository;
import com.onboardai.employees.OnboardingStatus;
import com.onboardai.notifications.NotificationService;
import com.onboardai.onboarding.*;
import com.onboardai.policies.CompanyPolicy;
import com.onboardai.policies.PolicyRepository;
import com.onboardai.policies.PolicyService;
import com.onboardai.tasks.*;
import com.onboardai.users.Organization;
import com.onboardai.users.OrganizationRepository;
import com.onboardai.users.Role;
import com.onboardai.users.User;
import com.onboardai.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
public class DataBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataBootstrapRunner.class);

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final OnboardingPlanRepository planRepository;
    private final OnboardingPlanTaskRepository planTaskRepository;
    private final OnboardingAssignmentRepository assignmentRepository;
    private final OnboardingTaskRepository taskRepository;
    private final DocumentRepository documentRepository;
    private final ApprovalRepository approvalRepository;
    private final PolicyRepository policyRepository;
    private final PolicyService policyService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final String storageLocation;

    public DataBootstrapRunner(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            OnboardingPlanRepository planRepository,
            OnboardingPlanTaskRepository planTaskRepository,
            OnboardingAssignmentRepository assignmentRepository,
            OnboardingTaskRepository taskRepository,
            DocumentRepository documentRepository,
            ApprovalRepository approvalRepository,
            PolicyRepository policyRepository,
            PolicyService policyService,
            NotificationService notificationService,
            AuditService auditService,
            PasswordEncoder passwordEncoder,
            @Value("${app.storage.location:./storage/documents}") String storageLocation) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.planRepository = planRepository;
        this.planTaskRepository = planTaskRepository;
        this.assignmentRepository = assignmentRepository;
        this.taskRepository = taskRepository;
        this.documentRepository = documentRepository;
        this.approvalRepository = approvalRepository;
        this.policyRepository = policyRepository;
        this.policyService = policyService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
        this.storageLocation = storageLocation;
    }

    private void syncDemoUser(String email, Role role, String password) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole(role);
            user.setActive(true);
            userRepository.save(user);
            log.info("Reset development demo credentials for: {} [{}] with OnboardAI@123", email, role);
        });
    }

    @Override
    public void run(String... args) throws Exception {
        // Ensure development demo credentials always use the requested standard development password: OnboardAI@123
        syncDemoUser("admin@acme.com", Role.HR_ADMIN, "OnboardAI@123");
        syncDemoUser("hrmanager@acme.com", Role.HR_MANAGER, "OnboardAI@123");
        syncDemoUser("manager@acme.com", Role.MANAGER, "OnboardAI@123");
        syncDemoUser("john.doe@acme.com", Role.EMPLOYEE, "OnboardAI@123");
        syncDemoUser("sarah.smith@acme.com", Role.EMPLOYEE, "OnboardAI@123");

        if (userRepository.findByEmail("admin@acme.com").isPresent()) {
            log.info("Demo bootstrap data verified. Demo account credentials synchronized with OnboardAI@123.");
            return;
        }

        log.info("Initializing OnboardAI bootstrap development data...");

        // 1. Organization
        Organization acme = organizationRepository.findByName("Acme Corporation")
                .orElseGet(() -> organizationRepository.saveAndFlush(new Organization("Acme Corporation", "acme.com")));
        UUID orgId = acme.getId();

        // 2. Users
        User admin = userRepository.save(new User(orgId, "Elena Vance (HR Admin)", "admin@acme.com",
                passwordEncoder.encode("OnboardAI@123"), Role.HR_ADMIN));
        User hrManager = userRepository.save(new User(orgId, "Marcus Brody (HR Manager)", "hrmanager@acme.com",
                passwordEncoder.encode("OnboardAI@123"), Role.HR_MANAGER));
        User manager = userRepository.save(new User(orgId, "David Miller (Eng Director)", "manager@acme.com",
                passwordEncoder.encode("OnboardAI@123"), Role.MANAGER));
        User john = userRepository.save(new User(orgId, "John Doe", "john.doe@acme.com",
                passwordEncoder.encode("OnboardAI@123"), Role.EMPLOYEE));
        User sarah = userRepository.save(new User(orgId, "Sarah Smith", "sarah.smith@acme.com",
                passwordEncoder.encode("OnboardAI@123"), Role.EMPLOYEE));

        // 3. Employees
        Employee managerEmp = employeeRepository.save(new Employee(
                orgId, manager.getId(), "EMP-M01", "Engineering", "Engineering Director", null, LocalDate.now().minusYears(2)
        ));
        managerEmp.setOnboardingStatus(OnboardingStatus.COMPLETED);
        employeeRepository.save(managerEmp);

        Employee johnEmp = employeeRepository.save(new Employee(
                orgId, john.getId(), "EMP-001", "Engineering", "Senior Software Engineer", managerEmp.getId(), LocalDate.now().minusDays(5)
        ));
        johnEmp.setOnboardingStatus(OnboardingStatus.IN_PROGRESS);
        employeeRepository.save(johnEmp);

        Employee sarahEmp = employeeRepository.save(new Employee(
                orgId, sarah.getId(), "EMP-002", "Product & Design", "Lead Product Designer", managerEmp.getId(), LocalDate.now().minusDays(2)
        ));
        sarahEmp.setOnboardingStatus(OnboardingStatus.IN_PROGRESS);
        employeeRepository.save(sarahEmp);

        // 4. Onboarding Plans
        OnboardingPlan engPlan = new OnboardingPlan(orgId, "Software Engineering Onboarding Plan",
                "Comprehensive onboarding track for frontend, backend, and full-stack software engineers.",
                "Software Engineer", "Engineering", admin.getId());

        engPlan.addTask(new OnboardingPlanTask("Submit Photo Identification & Tax Documents",
                "Upload a valid government-issued photographic ID and completed W-4 tax withholding form.",
                TaskCategory.DOCUMENTATION, 2, true, "EMPLOYEE", true, 0));

        engPlan.addTask(new OnboardingPlanTask("IT Workstation & Credential Setup",
                "Set up password manager, configure 2-factor authentication, and establish secure VPN connection.",
                TaskCategory.IT_SETUP, 3, true, "EMPLOYEE", false, 1));

        engPlan.addTask(new OnboardingPlanTask("Engineering Standards & CI/CD Walkthrough",
                "Review engineering handbook, clone repositories, and verify build passing on local environment.",
                TaskCategory.TRAINING, 5, true, "EMPLOYEE", false, 2));

        engPlan.addTask(new OnboardingPlanTask("1-on-1 Welcome Sync with Engineering Manager",
                "Meet with David Miller to discuss sprint roadmap, team charter, and 30-60-90 day expectations.",
                TaskCategory.HR_MEETING, 7, true, "EMPLOYEE", false, 3));

        engPlan.addTask(new OnboardingPlanTask("Complete ISO 27001 Security Training",
                "Complete mandatory compliance course on cybersecurity practices and phish reporting.",
                TaskCategory.COMPLIANCE, 10, true, "EMPLOYEE", false, 4));

        engPlan.addTask(new OnboardingPlanTask("Deploy First PR to Staging Environment",
                "Pick up a starter good-first-issue, open a pull request, and deploy changes to staging.",
                TaskCategory.TRAINING, 14, false, "EMPLOYEE", false, 5));

        engPlan = planRepository.save(engPlan);

        // 5. Assign Engineering Plan to John Doe
        LocalDate johnStart = johnEmp.getEmploymentStartDate();
        OnboardingAssignment johnAssignment = new OnboardingAssignment(
                orgId, johnEmp.getId(), engPlan.getId(), johnStart, johnStart.plusDays(30)
        );
        johnAssignment = assignmentRepository.save(johnAssignment);

        List<OnboardingPlanTask> templates = planTaskRepository.findAllByPlanIdOrderByOrderIndexAsc(engPlan.getId());
        int taskIndex = 0;
        for (OnboardingPlanTask tpl : templates) {
            OnboardingTask task = new OnboardingTask(
                    orgId,
                    johnAssignment.getId(),
                    johnEmp.getId(),
                    tpl.getTitle(),
                    tpl.getDescription(),
                    tpl.getCategory(),
                    tpl.isRequired() ? TaskPriority.HIGH : TaskPriority.MEDIUM,
                    john.getId(),
                    johnStart.plusDays(tpl.getRelativeDueDays()),
                    tpl.isRequired(),
                    tpl.isDocumentRequired()
            );

            // Mark first 2 tasks completed to show realistic 40% progress
            if (taskIndex == 0) {
                task.setStatus(TaskStatus.COMPLETED);
                task.setCompletedAt(Instant.now().minus(java.time.Duration.ofDays(3)));
                task.setComments("Passport and W-4 uploaded.");
            } else if (taskIndex == 1) {
                task.setStatus(TaskStatus.COMPLETED);
                task.setCompletedAt(Instant.now().minus(java.time.Duration.ofDays(1)));
                task.setComments("1Password and YubiKey configured successfully.");
            }
            taskRepository.save(task);
            taskIndex++;
        }

        johnAssignment.setCompletionPercentage(BigDecimal.valueOf(40.00));
        assignmentRepository.save(johnAssignment);

        // 6. Assign Plan to Sarah Smith
        OnboardingAssignment sarahAssignment = new OnboardingAssignment(
                orgId, sarahEmp.getId(), engPlan.getId(), sarahEmp.getEmploymentStartDate(), sarahEmp.getEmploymentStartDate().plusDays(30)
        );
        sarahAssignment = assignmentRepository.save(sarahAssignment);

        for (OnboardingPlanTask tpl : templates) {
            OnboardingTask task = new OnboardingTask(
                    orgId,
                    sarahAssignment.getId(),
                    sarahEmp.getId(),
                    tpl.getTitle(),
                    tpl.getDescription(),
                    tpl.getCategory(),
                    tpl.isRequired() ? TaskPriority.HIGH : TaskPriority.MEDIUM,
                    sarah.getId(),
                    sarahEmp.getEmploymentStartDate().plusDays(tpl.getRelativeDueDays()),
                    tpl.isRequired(),
                    tpl.isDocumentRequired()
            );
            taskRepository.save(task);
        }

        // 7. Seed Physical Files and Documents
        Path storageDir = Paths.get(storageLocation).toAbsolutePath().normalize();
        Files.createDirectories(storageDir);

        String sampleFile1 = "demo_passport_john_doe.pdf";
        String sampleFile2 = "demo_w4_john_doe.pdf";
        Path path1 = storageDir.resolve(sampleFile1);
        Path path2 = storageDir.resolve(sampleFile2);

        if (!Files.exists(path1)) {
            Files.writeString(path1, "%PDF-1.4 [Synthetic Demo Passport Document for John Doe - Acme Corp]");
        }
        if (!Files.exists(path2)) {
            Files.writeString(path2, "%PDF-1.4 [Synthetic Demo W-4 Withholding Form for John Doe - Acme Corp]");
        }

        Document doc1 = new Document(
                orgId, johnEmp.getId(), "ID_PROOF", "Passport_JohnDoe.pdf", sampleFile1, "application/pdf", 1024, john.getId()
        );
        doc1.setVerificationStatus(DocumentVerificationStatus.VERIFIED);
        doc1.setVerifiedBy(hrManager.getId());
        doc1.setVerifiedAt(Instant.now().minus(java.time.Duration.ofDays(2)));
        doc1.setExtractedMetadata("{\"Document Type\":\"Passport\",\"Candidate Name\":\"John Doe\",\"Nationality\":\"USA\",\"Expiry\":\"2034-05-12\"}");
        doc1 = documentRepository.save(doc1);

        Document doc2 = new Document(
                orgId, johnEmp.getId(), "TAX_FORM", "W4_Form_2026.pdf", sampleFile2, "application/pdf", 2048, john.getId()
        );
        doc2.setVerificationStatus(DocumentVerificationStatus.PENDING);
        doc2 = documentRepository.save(doc2);

        // 8. Seed Approvals
        Approval w4Approval = new Approval(orgId, johnEmp.getId(), doc2.getId(), null, john.getId(), hrManager.getId());
        w4Approval.setComments("Please review and verify federal tax withholding submission.");
        approvalRepository.save(w4Approval);

        // 9. Seed Company Policies
        String policyContent1 = """
                # Acme Corporation Employee Handbook & Leave Guidelines
                
                ## Standard Working Hours and Flexibility
                Acme Corporation operates with core collaborative hours between 10:00 AM and 3:00 PM local time.
                Employees enjoy flexible work schedules, provided team coverage is maintained and deadlines are honored.
                
                ## Paid Time Off (PTO) & Vacation Accrual
                Full-time employees receive 25 days of Paid Time Off (PTO) per calendar year, accrued monthly.
                PTO requests of three days or more must be submitted through the portal at least two weeks in advance.
                Up to 5 unused PTO days may be rolled over into the subsequent calendar year.
                
                ## Sick Leave & Personal Wellness Days
                Employees are allocated 10 paid wellness and sick days annually. Medical documentation is only required
                for absences exceeding four consecutive business days.
                
                ## Equipment & Home Office Reimbursement
                New employees receive a high-performance MacBook Pro or Dell Precision workstation, plus a $1,000
                one-time home office reimbursement for monitors, ergonomic seating, and desk accessories.
                Expense reports must be filed within 60 days of purchase with itemized receipts.
                """;

        String policyContent2 = """
                # Information Security & Acceptable Use Policy
                
                ## Password and Credential Protection
                All corporate accounts must enforce multi-factor authentication (MFA) via hardware security keys or
                authenticator apps. Passwords must be at least 14 characters in length and stored in approved corporate password managers.
                
                ## Workstation Security & Encryption
                Full-disk encryption (BitLocker for Windows, FileVault for macOS) must remain active at all times.
                Workstation screens must lock automatically after 5 minutes of inactivity.
                
                ## Remote Access & VPN
                Connecting to corporate code repositories or production environments from public or unsecured Wi-Fi
                requires the immediate engagement of the Acme Corporate VPN.
                
                ## Incident Reporting
                Any lost devices, suspicious emails, or potential data breaches must be reported immediately to
                security@acme.com or via the Slack #security-incident emergency channel.
                """;

        CompanyPolicy p1 = new CompanyPolicy(orgId, "Employee Handbook & Leave Guidelines", "BENEFITS",
                "Official guidelines governing working hours, PTO, wellness days, and home office stipends.", policyContent1, admin.getId());
        policyService.chunkPolicyText(orgId, p1.getTitle(), policyContent1).forEach(p1::addChunk);
        policyRepository.save(p1);

        CompanyPolicy p2 = new CompanyPolicy(orgId, "Information Security & Acceptable Use Policy", "IT_SECURITY",
                "Security standards for data protection, encryption, hardware keys, and remote connectivity.", policyContent2, admin.getId());
        policyService.chunkPolicyText(orgId, p2.getTitle(), policyContent2).forEach(p2::addChunk);
        policyRepository.save(p2);

        // 10. Seed Notifications
        notificationService.createNotification(orgId, john.getId(),
                "Welcome to Acme Corporation!",
                "Your onboarding plan has been activated. Please complete your profile and pending tasks.",
                "WELCOME", "/dashboard/tasks");

        notificationService.createNotification(orgId, hrManager.getId(),
                "Pending Document Verification",
                "John Doe uploaded W4_Form_2026.pdf for review.",
                "APPROVAL", "/dashboard/approvals");

        // 11. Seed Audit Logs
        auditService.recordAction(orgId, admin.getId(), "SYSTEM_BOOTSTRAP", "Organization", orgId.toString(),
                "Initialized demo organization, seed users, plans, and company policies.");

        log.info("OnboardAI bootstrap development data successfully created!");
    }
}
