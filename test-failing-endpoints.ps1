# Test failing endpoints to debug
$base = "http://localhost:5000/api"

# Login as admin
Write-Host "Logging in as admin..." -ForegroundColor Yellow
$adminLogin = Invoke-RestMethod -Uri "$base/auth/admin-login" -Method POST -ContentType "application/json" -Body (@{
    email = "admin@fixbuddy.com"
    password = "AdminPass123"
    adminCode = "123456"
} | ConvertTo-Json)

$adminToken = $adminLogin.token
Write-Host "✅ Admin logged in`n" -ForegroundColor Green

# Create a test ticket first
Write-Host "Creating test ticket..." -ForegroundColor Yellow
$ticketRes = Invoke-RestMethod -Uri "$base/tickets" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{
    title = "Test Ticket"
    description = "For testing admin responses"
    priority = "high"
    category = "Test"
} | ConvertTo-Json)
$ticketId = $ticketRes.data.id
Write-Host "✅ Ticket created: ID $ticketId`n" -ForegroundColor Green

# Test Add Response
Write-Host "Testing Add Response endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$base/helpdesk/tickets/$ticketId/response" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -Body (@{
        response = "We are looking into this issue"
        responseType = "admin"
    } | ConvertTo-Json) -ErrorAction Stop
    Write-Host "✅ Add Response Success`n" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Add Response Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    try {
        $errorContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "Details: $errorContent`n" -ForegroundColor Yellow
    } catch {}
}

# Test Get Activities
Write-Host "Testing Get Activities endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$base/helpdesk/activities" -Method GET -Headers @{Authorization="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✅ Get Activities Success`n" -ForegroundColor Green
    Write-Host "Activities count: $($response.data.activities.Count)"
} catch {
    Write-Host "❌ Get Activities Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test Get Notifications
Write-Host "Testing Get Notifications endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$base/helpdesk/notifications" -Method GET -Headers @{Authorization="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✅ Get Notifications Success`n" -ForegroundColor Green
    Write-Host "Notifications count: $($response.data.notifications.Count)"
} catch {
    Write-Host "❌ Get Notifications Failed" -ForegroundColor Red  
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
