# Test the specific helpdesk endpoints mentioned by user
$base = "http://localhost:5000/api"

# Login as admin
Write-Host "Logging in as admin..." -ForegroundColor Yellow
$adminLogin = Invoke-WebRequest -Uri "$base/auth/admin-login" -Method POST -ContentType "application/json" -Body (@{
    email = "admin@fixbuddy.com"
    password = "AdminPass123"
    adminCode = "123456"
} | ConvertTo-Json) -UseBasicParsing

$adminLoginData = $adminLogin.Content | ConvertFrom-Json
$adminToken = $adminLoginData.token
Write-Host "✅ Admin logged in`n" -ForegroundColor Green

# Create a test ticket first
Write-Host "Creating test ticket..." -ForegroundColor Yellow
$ticketRes = Invoke-WebRequest -Uri "$base/tickets" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{
    title = "Test Ticket for API Testing"
    description = "Testing the new helpdesk endpoints"
    priority = "high"
    category = "Test"
} | ConvertTo-Json) -UseBasicParsing

$ticketData = $ticketRes.Content | ConvertFrom-Json
$ticketId = $ticketData.data.id
Write-Host "✅ Ticket created: ID $ticketId`n" -ForegroundColor Green

# Test the specific endpoints mentioned by user

Write-Host "=== TESTING SPECIFIC ENDPOINTS ===" -ForegroundColor Cyan

# 20. Get ticket analytics
Write-Host "20. Testing Get Ticket Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/analytics" -Method GET -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Get Ticket Analytics Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Ticket Analytics Failed - Not implemented" -ForegroundColor Red
}

# 21. Update ticket priority
Write-Host "21. Testing Update Ticket Priority..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId/priority" -Method PATCH -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{priority="critical"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Update Ticket Priority Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Update Ticket Priority Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 22. Update ticket status
Write-Host "22. Testing Update Ticket Status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId/status" -Method PATCH -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{status="in_progress"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Update Ticket Status Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Update Ticket Status Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 23. DELETE ticket
Write-Host "23. Testing DELETE Ticket..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId" -Method DELETE -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ DELETE Ticket Success" -ForegroundColor Green
} catch {
    Write-Host "❌ DELETE Ticket Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Create another ticket for remaining tests
Write-Host "`nCreating another test ticket..." -ForegroundColor Yellow
$ticketRes2 = Invoke-WebRequest -Uri "$base/tickets" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{
    title = "Second Test Ticket"
    description = "For remaining endpoint tests"
    priority = "medium"
    category = "Test"
} | ConvertTo-Json) -UseBasicParsing

$ticketData2 = $ticketRes2.Content | ConvertFrom-Json
$ticketId2 = $ticketData2.data.id
Write-Host "✅ Second ticket created: ID $ticketId2`n" -ForegroundColor Green

# 24. Get ticket details
Write-Host "24. Testing Get Ticket Details..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId2" -Method GET -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Get Ticket Details Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Ticket Details Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 25. Get all tickets
Write-Host "25. Testing Get All Tickets..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets" -Method GET -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Get All Tickets Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Tickets Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 26. Assign ticket
Write-Host "26. Testing Assign Ticket..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId2/assign" -Method PATCH -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{assignedTo=2} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Assign Ticket Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Assign Ticket Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 27. Close ticket
Write-Host "27. Testing Close Ticket..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId2/close" -Method PATCH -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Close Ticket Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Close Ticket Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Create third ticket for response tests
Write-Host "`nCreating third test ticket..." -ForegroundColor Yellow
$ticketRes3 = Invoke-WebRequest -Uri "$base/tickets" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{
    title = "Third Test Ticket"
    description = "For response and solve tests"
    priority = "low"
    category = "Test"
} | ConvertTo-Json) -UseBasicParsing

$ticketData3 = $ticketRes3.Content | ConvertFrom-Json
$ticketId3 = $ticketData3.data.id
Write-Host "✅ Third ticket created: ID $ticketId3`n" -ForegroundColor Green

# 28. Add response
Write-Host "28. Testing Add Response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId3/response" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{response="Test response"; responseType="admin"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Add Response Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Add Response Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 29. Solve ticket
Write-Host "29. Testing Solve Ticket..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/tickets/$ticketId3/solve" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{solution="Issue resolved"} | ConvertTo-Json) -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Solve Ticket Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Solve Ticket Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 30. Get all users
Write-Host "30. Testing Get All Users..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/users" -Method GET -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Get All Users Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get All Users Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 31. Get notifications
Write-Host "31. Testing Get Notifications..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/helpdesk/notifications" -Method GET -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Get Notifications Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Notifications Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ENDPOINT TEST COMPLETE ===" -ForegroundColor Cyan