# Test New Features Script
# This script tests the new activity logging and priority/status endpoints

$baseUrl = "http://localhost:5000/api"

Write-Host "Testing New FixBuddy Features" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# 1. Login as admin
Write-Host "`n1. Logging in as Admin..." -ForegroundColor Yellow
$adminLoginData = @{
    email = "admin@fixbuddy.com"
    password = "AdminPass123"
    adminCode = "123456"
} | ConvertTo-Json

try {
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/admin-login" -Method POST -ContentType "application/json" -Body $adminLoginData
    Write-Host "Admin logged in: $($adminLogin.data.id)" -ForegroundColor Green
    $adminToken = $adminLogin.token
} catch {
    Write-Host "Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Create regular user
Write-Host "`n2. Creating Regular User..." -ForegroundColor Yellow
$userData = @{
    name = "Test User"
    email = "testuser_$(Get-Random)@test.com"
    password = "Password123!"
    confirmPassword = "Password123!"
} | ConvertTo-Json

try {
    $userSignup = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -ContentType "application/json" -Body $userData
    Write-Host "User created: $($userSignup.data.id)" -ForegroundColor Green
    $userToken = $userSignup.token
    $userId = $userSignup.data.id
} catch {
    Write-Host "User signup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Create a ticket
Write-Host "`n3. Creating Test Ticket..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $userToken" }
$ticketData = @{
    title = "Test Ticket for Priority/Status Updates"
    description = "This ticket will be used to test the new priority and status update endpoints with activity logging."
    priority = "medium"
} | ConvertTo-Json

try {
    $ticket = Invoke-RestMethod -Uri "$baseUrl/tickets" -Method POST -Headers $headers -ContentType "application/json" -Body $ticketData
    Write-Host "Ticket created: $($ticket.data.id)" -ForegroundColor Green
    $ticketId = $ticket.data.id
} catch {
    Write-Host "Ticket creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Test Priority Update Endpoint
Write-Host "`n4. Testing Priority Update Endpoint..." -ForegroundColor Yellow
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
$priorityData = @{ priority = "high" } | ConvertTo-Json

try {
    $priorityUpdate = Invoke-RestMethod -Uri "$baseUrl/helpdesk/tickets/$ticketId/priority" -Method PATCH -Headers $adminHeaders -ContentType "application/json" -Body $priorityData
    Write-Host "Priority update response:" -ForegroundColor Green
    $priorityUpdate | ConvertTo-Json | Write-Host
    Write-Host "Priority updated to: $($priorityUpdate.data.priority)" -ForegroundColor Green
} catch {
    Write-Host "Priority update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test Status Update Endpoint
Write-Host "`n5. Testing Status Update Endpoint..." -ForegroundColor Yellow
$statusData = @{ status = "in_progress" } | ConvertTo-Json

try {
    $statusUpdate = Invoke-RestMethod -Uri "$baseUrl/helpdesk/tickets/$ticketId/status" -Method PATCH -Headers $adminHeaders -ContentType "application/json" -Body $statusData
    Write-Host "Status updated to: $($statusUpdate.data.status)" -ForegroundColor Green
} catch {
    Write-Host "Status update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Check Activity Logging
Write-Host "`n6. Checking Activity Logging..." -ForegroundColor Yellow
try {
    $activities = Invoke-RestMethod -Uri "$baseUrl/helpdesk/activities?limit=50" -Method GET -Headers $adminHeaders
    Write-Host "Found $($activities.data.activities.Count) activities:" -ForegroundColor Green
    foreach ($activity in $activities.data.activities) {
        Write-Host "   - $($activity.type): $($activity.details)" -ForegroundColor Gray
        if ($activity.oldValue -and $activity.newValue) {
            Write-Host "     Old: $($activity.oldValue) -> New: $($activity.newValue)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Activity fetch failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Test Ticket Response (adds comment)
Write-Host "`n7. Testing Ticket Response..." -ForegroundColor Yellow
$responseData = @{
    response = "We are investigating this issue. Will update shortly."
    responseType = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/helpdesk/tickets/$ticketId/response" -Method POST -Headers $adminHeaders -ContentType "application/json" -Body $responseData
    Write-Host "Response added to ticket" -ForegroundColor Green
} catch {
    Write-Host "Response failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Test Ticket Solve
Write-Host "`n8. Testing Ticket Solve..." -ForegroundColor Yellow
$solveData = @{ solution = "Issue resolved by resetting network configuration." } | ConvertTo-Json

try {
    $solve = Invoke-RestMethod -Uri "$baseUrl/helpdesk/tickets/$ticketId/solve" -Method POST -Headers $adminHeaders -ContentType "application/json" -Body $solveData
    Write-Host "Ticket marked as solved" -ForegroundColor Green
} catch {
    Write-Host "Solve failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Test Ticket Close
Write-Host "`n9. Testing Ticket Close..." -ForegroundColor Yellow
try {
    $close = Invoke-RestMethod -Uri "$baseUrl/helpdesk/tickets/$ticketId/close" -Method PATCH -Headers $adminHeaders
    Write-Host "Ticket closed" -ForegroundColor Green
} catch {
    Write-Host "Close failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Final Activity Check
Write-Host "`n10. Final Activity Check..." -ForegroundColor Yellow
try {
    $finalActivities = Invoke-RestMethod -Uri "$baseUrl/helpdesk/activities?limit=50" -Method GET -Headers $adminHeaders
    Write-Host "Total activities: $($finalActivities.data.activities.Count)" -ForegroundColor Green
    Write-Host "Recent activities:" -ForegroundColor Cyan
    $recent = $finalActivities.data.activities | Select-Object -First 5
    foreach ($activity in $recent) {
        Write-Host "   - $($activity.type): $($activity.details)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Final activity check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n*** Feature Testing Complete! ***" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green