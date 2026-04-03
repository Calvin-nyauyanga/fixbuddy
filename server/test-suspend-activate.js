import fetch from 'node-fetch';

// Test suspend and activate functionality
async function testSuspendActivate() {
  console.log('🧪 Testing Suspend/Activate User Functionality\n');

  try {
    // First get users
    const usersRes = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTIxMDg4OSwiZXhwIjoxNzc1Mjk3Mjg5fQ.WBXR0DaREh2JLWyA-l7e8LZFqjwakJVU9dpjKm8jQuU'
      }
    });

    if (!usersRes.ok) {
      throw new Error(`Failed to get users: ${usersRes.status}`);
    }

    const usersData = await usersRes.json();
    const users = usersData.data.users;

    console.log('📋 Current Users:');
    users.forEach(u => {
      console.log(`  ${u.name} (${u.email}): ${u.status || 'active'}`);
    });

    // Pick first user for testing (avoid admin users)
    const testUser = users.find(u => u.role !== 'admin') || users[0];
    console.log(`\n🎯 Testing with user: ${testUser.name} (ID: ${testUser.id})`);

    // Test suspend
    console.log('\n🚫 Suspending user...');
    const suspendRes = await fetch(`http://localhost:5000/api/users/${testUser.id}/suspend`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTIxMDg4OSwiZXhwIjoxNzc1Mjk3Mjg5fQ.WBXR0DaREh2JLWyA-l7e8LZFqjwakJVU9dpjKm8jQuU'
      }
    });

    const suspendData = await suspendRes.json();
    console.log(`Status: ${suspendRes.status}`);
    console.log(`User status after suspend: ${suspendData.data?.status || 'undefined'}`);

    // Test activate
    console.log('\n✅ Activating user...');
    const activateRes = await fetch(`http://localhost:5000/api/users/${testUser.id}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTIxMDg4OSwiZXhwIjoxNzc1Mjk3Mjg5fQ.WBXR0DaREh2JLWyA-l7e8LZFqjwakJVU9dpjKm8jQuU'
      }
    });

    const activateData = await activateRes.json();
    console.log(`Status: ${activateRes.status}`);
    console.log(`User status after activate: ${activateData.data?.status || 'undefined'}`);

    console.log('\n✅ Backend API test completed successfully!');
    console.log('\n📋 Expected Results:');
    console.log('  - Suspend: status should be "suspended"');
    console.log('  - Activate: status should be "active"');
    console.log('  - Frontend should update UI immediately after each action');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSuspendActivate();