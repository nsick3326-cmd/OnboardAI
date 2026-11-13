$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api/v1"
$passCount = 0
$failCount = 0

function Report-Pass($name, $details = "") {
    $script:passCount++
    Write-Host " [PASS] $name" -ForegroundColor Green
    if ($details) {
        Write-Host "        $details" -ForegroundColor Gray
    }
}

function Report-Fail($name, $reason) {
    $script:failCount++
    Write-Host " [FAIL] $name" -ForegroundColor Red
    Write-Host "        Reason: $reason" -ForegroundColor Yellow
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  OnboardAI Comprehensive Invitation & Account Activation QA Test Suite   " -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# -------------------------------------------------------------------------
# Test 1: HR Admin Authenticates
# -------------------------------------------------------------------------
try {
    $loginBody = @{
        email = "admin@acme.com"
        password = "OnboardAI@123"
        selectedRole = "HR_ADMIN"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $adminToken = $loginRes.data.token
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    Report-Pass "Test 1: HR Admin login" "Admin token acquired for: admin@acme.com"
} catch {
    Report-Fail "Test 1: HR Admin login" $_.Exception.Message
    exit 1
}

# -------------------------------------------------------------------------
# Test 2: HR Admin Creates New Employee & Generates Invitation
# -------------------------------------------------------------------------
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$chloeEmail = "chloe.evans.$timestamp@acme.com"
$chloeRawToken = ""
$chloeInvId = ""

try {
    $createEmpBody = @{
        fullName = "Chloe Evans"
        email = $chloeEmail
        phoneNumber = "+1 555-0144"
        department = "Engineering"
        jobTitle = "Frontend Engineer"
        employmentStartDate = (Get-Date).ToString("yyyy-MM-dd")
        employmentType = "FULL_TIME"
        role = "EMPLOYEE"
    } | ConvertTo-Json

    $inviteRes = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $createEmpBody -Headers $adminHeaders -ContentType "application/json" -UseBasicParsing
    $chloeInvId = $inviteRes.id
    
    if (-not $inviteRes.activationLink) {
        throw "Activation link was not returned in response"
    }
    
    # Extract raw token from activationLink
    $chloeRawToken = ($inviteRes.activationLink -split "token=")[1]
    
    if ($inviteRes.status -ne "PENDING") {
        throw "Expected status PENDING, got $($inviteRes.status)"
    }
    if ($inviteRes.role -ne "EMPLOYEE") {
        throw "Expected role EMPLOYEE, got $($inviteRes.role)"
    }

    Report-Pass "Test 2: HR Admin creates employee and generates pending invitation" "Candidate: $($inviteRes.fullName), Status: $($inviteRes.status), Raw Token Length: $($chloeRawToken.Length)"
} catch {
    Report-Fail "Test 2: HR Admin creates employee" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 3: Public Invitation Token Validation
# -------------------------------------------------------------------------
try {
    $valRes = Invoke-RestMethod -Uri "$baseUrl/invitations/validate?token=$chloeRawToken" -Method Get -UseBasicParsing
    if (-not $valRes.valid) {
        throw "Validation returned valid=false: $($valRes.message)"
    }
    if ($valRes.fullName -ne "Chloe Evans") {
        throw "Expected candidate 'Chloe Evans', got '$($valRes.fullName)'"
    }
    if ($valRes.organizationName -notmatch "Acme") {
        throw "Expected organization containing 'Acme', got '$($valRes.organizationName)'"
    }
    if ($valRes.role -ne "EMPLOYEE") {
        throw "Expected locked role 'EMPLOYEE', got '$($valRes.role)'"
    }
    Report-Pass "Test 3: Unauthenticated token validation" "Token validated for $($valRes.fullName) at $($valRes.organizationName) with role $($valRes.role)"
} catch {
    Report-Fail "Test 3: Unauthenticated token validation" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 4: Employee Activates Account & Sets Password
# -------------------------------------------------------------------------
$chloePassword = "ChloeSecret@2026"
try {
    $acceptBody = @{
        token = $chloeRawToken
        password = $chloePassword
    } | ConvertTo-Json

    $acceptRes = Invoke-RestMethod -Uri "$baseUrl/invitations/accept" -Method Post -Body $acceptBody -ContentType "application/json" -UseBasicParsing
    if ($acceptRes.status -ne "ACCEPTED") {
        throw "Expected status ACCEPTED, got $($acceptRes.status)"
    }
    Report-Pass "Test 4: Employee activates account" "Account activated! Status: $($acceptRes.status), AcceptedAt: $($acceptRes.acceptedAt)"
} catch {
    Report-Fail "Test 4: Employee activates account" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 5: New Employee Logs In with New Password
# -------------------------------------------------------------------------
$chloeToken = ""
try {
    $chloeLoginBody = @{
        email = $chloeEmail
        password = $chloePassword
        selectedRole = "EMPLOYEE"
    } | ConvertTo-Json

    $chloeLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $chloeLoginBody -ContentType "application/json" -UseBasicParsing
    $chloeToken = $chloeLoginRes.data.token
    if (-not $chloeToken) {
        throw "No JWT token returned for new employee"
    }
    if ($chloeLoginRes.data.user.role -ne "EMPLOYEE") {
        throw "Role mismatch: expected EMPLOYEE, got $($chloeLoginRes.data.user.role)"
    }
    Report-Pass "Test 5: New employee logs in" "Authenticated successfully! User ID: $($chloeLoginRes.data.user.id), Role: $($chloeLoginRes.data.user.role)"
} catch {
    Report-Fail "Test 5: New employee logs in" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 6: New Employee Accesses Employee Dashboard & Task View
# -------------------------------------------------------------------------
try {
    $chloeHeaders = @{
        "Authorization" = "Bearer $chloeToken"
        "Content-Type" = "application/json"
    }
    $meRes = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $chloeHeaders -UseBasicParsing
    if ($meRes.data.email -ne $chloeEmail) {
        throw "Profile email mismatch: $($meRes.data.email)"
    }
    
    $tasksRes = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Get -Headers $chloeHeaders -UseBasicParsing
    Report-Pass "Test 6: Employee dashboard & task access" "Accessed workspace successfully as $($meRes.data.fullName) ($($meRes.data.role))"
} catch {
    Report-Fail "Test 6: Employee dashboard access" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 7: Reused Invitation Token is Rejected
# -------------------------------------------------------------------------
try {
    $reusedVal = Invoke-RestMethod -Uri "$baseUrl/invitations/validate?token=$chloeRawToken" -Method Get -UseBasicParsing
    if ($reusedVal.valid) {
        throw "Reused token should return valid=false"
    }
    if ($reusedVal.message -notmatch "already been accepted|used") {
        throw "Expected already accepted error message, got: $($reusedVal.message)"
    }
    Report-Pass "Test 7: Reused token rejected on validation" "Returned: $($reusedVal.message)"
} catch {
    Report-Fail "Test 7: Reused token rejection" $_.Exception.Message
}

try {
    $reusedAcceptBody = @{
        token = $chloeRawToken
        password = "AnotherPassword123!"
    } | ConvertTo-Json
    $shouldFail = Invoke-RestMethod -Uri "$baseUrl/invitations/accept" -Method Post -Body $reusedAcceptBody -ContentType "application/json" -UseBasicParsing
    Report-Fail "Test 7b: Reused token acceptance" "Server should have rejected reused token"
} catch {
    Report-Pass "Test 7b: Reused token acceptance blocked" "Server rejected re-acceptance attempt correctly"
}

# -------------------------------------------------------------------------
# Test 8: Revoked Invitation is Rejected
# -------------------------------------------------------------------------
try {
    $revokeCandidateEmail = "revoke.test.$timestamp@acme.com"
    $revokeBody = @{
        fullName = "Revoke Candidate"
        email = $revokeCandidateEmail
        department = "Operations"
        jobTitle = "Coordinator"
        employmentStartDate = (Get-Date).ToString("yyyy-MM-dd")
        role = "EMPLOYEE"
    } | ConvertTo-Json

    $createRevokeRes = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $revokeBody -Headers $adminHeaders -ContentType "application/json" -UseBasicParsing
    $revokeRawToken = ($createRevokeRes.activationLink -split "token=")[1]
    $revokeId = $createRevokeRes.id

    # Revoke invitation
    $revokedRes = Invoke-RestMethod -Uri "$baseUrl/invitations/$revokeId/revoke" -Method Post -Headers $adminHeaders -UseBasicParsing
    if ($revokedRes.status -ne "REVOKED") {
        throw "Expected status REVOKED, got $($revokedRes.status)"
    }

    # Attempt to validate revoked token
    $valRevoked = Invoke-RestMethod -Uri "$baseUrl/invitations/validate?token=$revokeRawToken" -Method Get -UseBasicParsing
    if ($valRevoked.valid) {
        throw "Revoked token should return valid=false"
    }
    if ($valRevoked.message -notmatch "revoked") {
        throw "Expected revoked message, got: $($valRevoked.message)"
    }
    Report-Pass "Test 8: Revoked invitation is rejected" "Status correctly set to REVOKED and token rejected"
} catch {
    Report-Fail "Test 8: Revoked invitation" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 9: Resend Invitation Generates New Token & Invalidates Old Token
# -------------------------------------------------------------------------
try {
    $resendEmail = "resend.test.$timestamp@acme.com"
    $resendBody = @{
        fullName = "Resend Candidate"
        email = $resendEmail
        department = "Sales"
        jobTitle = "Account Exec"
        employmentStartDate = (Get-Date).ToString("yyyy-MM-dd")
        role = "EMPLOYEE"
    } | ConvertTo-Json

    $initRes = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $resendBody -Headers $adminHeaders -ContentType "application/json" -UseBasicParsing
    $oldToken = ($initRes.activationLink -split "token=")[1]
    $resendId = $initRes.id

    # Resend invitation
    $resentRes = Invoke-RestMethod -Uri "$baseUrl/invitations/$resendId/resend" -Method Post -Headers $adminHeaders -UseBasicParsing
    $newToken = ($resentRes.activationLink -split "token=")[1]

    if ($oldToken -eq $newToken) {
        throw "New token must not equal old token"
    }

    # Validate old token -> must fail
    $oldVal = Invoke-RestMethod -Uri "$baseUrl/invitations/validate?token=$oldToken" -Method Get -UseBasicParsing
    if ($oldVal.valid) {
        throw "Old invalidated token must be rejected"
    }

    # Validate new token -> must succeed
    $newVal = Invoke-RestMethod -Uri "$baseUrl/invitations/validate?token=$newToken" -Method Get -UseBasicParsing
    if (-not $newVal.valid) {
        throw "New regenerated token should be valid"
    }

    Report-Pass "Test 9: Resend invitation invalidates old token and issues fresh token" "Old token invalidated, new token verified"
} catch {
    Report-Fail "Test 9: Resend invitation" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 10: HR Manager and Team Manager Invitation Permissions
# -------------------------------------------------------------------------
try {
    # 10a. Login as HR_MANAGER
    $hrMgrLoginBody = @{
        email = "hrmanager@acme.com"
        password = "OnboardAI@123"
        selectedRole = "HR_MANAGER"
    } | ConvertTo-Json
    $hrMgrLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $hrMgrLoginBody -ContentType "application/json" -UseBasicParsing
    $hrMgrHeaders = @{
        "Authorization" = "Bearer $($hrMgrLoginRes.data.token)"
        "Content-Type" = "application/json"
    }

    # 10b. HR Manager invites a Team Manager -> SUCCESS
    $mgrInviteBody = @{
        fullName = "Engineering Team Lead"
        email = "lead.$timestamp@acme.com"
        department = "Engineering"
        jobTitle = "Tech Lead"
        employmentStartDate = (Get-Date).ToString("yyyy-MM-dd")
        role = "MANAGER"
    } | ConvertTo-Json
    $mgrInviteRes = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $mgrInviteBody -Headers $hrMgrHeaders -ContentType "application/json" -UseBasicParsing
    if ($mgrInviteRes.role -ne "MANAGER") {
        throw "Expected role MANAGER, got $($mgrInviteRes.role)"
    }
    Report-Pass "Test 10a: HR Manager can invite Team Manager" "Created Team Manager invitation for $($mgrInviteRes.email)"

    # 10c. HR Manager attempts to invite an HR_ADMIN -> MUST BE REJECTED
    $illegalAdminBody = @{
        fullName = "Fake Admin"
        email = "fakeadmin.$timestamp@acme.com"
        department = "Executive"
        jobTitle = "Director"
        employmentStartDate = (Get-Date).ToString("yyyy-MM-dd")
        role = "HR_ADMIN"
    } | ConvertTo-Json

    try {
        $shouldFailAdmin = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $illegalAdminBody -Headers $hrMgrHeaders -ContentType "application/json" -UseBasicParsing
        Report-Fail "Test 10b: HR Manager inviting HR Admin" "Server should have rejected HR Manager inviting HR Admin"
    } catch {
        Report-Pass "Test 10b: HR Manager blocked from inviting HR Admin" "Role hierarchy properly enforced"
    }

    # 10d. Employee attempts to invite someone -> MUST BE REJECTED (403)
    try {
        $shouldFailEmp = Invoke-RestMethod -Uri "$baseUrl/invitations" -Method Post -Body $mgrInviteBody -Headers $chloeHeaders -ContentType "application/json" -UseBasicParsing
        Report-Fail "Test 10c: Employee inviting user" "Employee should not have permission to invite users"
    } catch {
        Report-Pass "Test 10c: Regular employee blocked from invitation API" "Spring Security @PreAuthorize properly blocked non-HR"
    }
} catch {
    Report-Fail "Test 10: Role permission enforcement" $_.Exception.Message
}

# -------------------------------------------------------------------------
# Test 11: First Company Administrator & Workspace Setup Security
# -------------------------------------------------------------------------
try {
    # Check setup status
    $statusRes = Invoke-RestMethod -Uri "$baseUrl/auth/setup-status" -Method Get -UseBasicParsing
    if ($statusRes.data.initialSetupAllowed) {
        throw "Initial setup should be locked because organization already exists"
    }
    Report-Pass "Test 11a: Initial organization setup locked" "initialSetupAllowed=false (Protected from public abuse)"

    # Attempt setup without secret key -> MUST BE REJECTED
    $badSetupBody = @{
        organizationName = "Rogue Org"
        adminFullName = "Rogue Admin"
        adminEmail = "rogue.$timestamp@rogue.com"
        adminPassword = "RoguePass@123"
    } | ConvertTo-Json
    try {
        $shouldFailSetup = Invoke-RestMethod -Uri "$baseUrl/auth/setup-workspace" -Method Post -Body $badSetupBody -ContentType "application/json" -UseBasicParsing
        Report-Fail "Test 11b: Unprotected workspace setup" "Should have required setup key"
    } catch {
        Report-Pass "Test 11b: Unauthorized workspace setup blocked" "Blocked with 401/403"
    }

    # Setup with valid setupKey
    $validSetupBody = @{
        organizationName = "Beta Innovations"
        domain = "betainnovations.com"
        adminFullName = "Beta Admin"
        adminEmail = "admin.$timestamp@betainnovations.com"
        adminPassword = "BetaAdminPass@123"
        setupKey = "OnboardAI-Admin-Setup-Secret-2026"
    } | ConvertTo-Json
    $goodSetup = Invoke-RestMethod -Uri "$baseUrl/auth/setup-workspace" -Method Post -Body $validSetupBody -ContentType "application/json" -UseBasicParsing
    if ($goodSetup.data.organizationName -ne "Beta Innovations") {
        throw "Unexpected org name: $($goodSetup.data.organizationName)"
    }
    Report-Pass "Test 11c: Authorized workspace setup with secret key succeeds" "Provisioned new organization: $($goodSetup.data.organizationName) with admin: $($goodSetup.data.adminEmail)"
} catch {
    Report-Fail "Test 11: Workspace setup security" $_.Exception.Message
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  Test Summary: $passCount Passed, $failCount Failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
