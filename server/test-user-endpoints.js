import fetch from 'node-fetch';

(async () => {
  try {
    console.log('auth admin-login...');
    const loginRes = await fetch('http://localhost:5000/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nyauyangacalvint@gmail.com',
        password: 'Abcd1234567890p',
        adminCode: '123456'
      })
    });
    const loginJson = await loginRes.json();
    console.log('login status', loginRes.status, loginJson);
    if (!loginRes.ok) {
      console.error('admin-login failed');
      return;
    }

    const token = loginJson.token;
    if (!token) {
      console.error('No token from login');
      return;
    }

    const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const list = [
      { name: 'GET /api/auth/admin/profile', url: 'http://localhost:5000/api/auth/admin/profile', method: 'GET', body: null },
      { name: 'GET /api/users', url: 'http://localhost:5000/api/users', method: 'GET', body: null },
      { name: 'GET /api/users/search?q=test', url: 'http://localhost:5000/api/users/search?q=test', method: 'GET', body: null },
    ];

    for (const item of list) {
      const resp = await fetch(item.url, { method: item.method, headers: authHeader });
      const content = await resp.json().catch(() => null);
      console.log(`${item.name} ->`, resp.status, content);
    }

    // create
    console.log('POST /api/users');
    const createResp = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ name: 'Test User 1', email: 'testuser1@example.com', password: 'Password123!', role: 'user' })
    });
    const createData = await createResp.json().catch(() => null);
    console.log('->', createResp.status, createData);

    const userId = createData?.data?.id;
    if (!userId) {
      console.error('No userId from creation, stopping');
      return;
    }

    const base = `http://localhost:5000/api/users/${userId}`;

    const actions = [
      { name: `PUT /api/users/${userId}`, url: base, opts: { method: 'PUT', headers: authHeader, body: JSON.stringify({ name: 'Test User Updated', email: 'testuser1@example.com' }) } },
      { name: `PATCH /api/users/${userId}/suspend`, url: `${base}/suspend`, opts: { method: 'PATCH', headers: authHeader } },
      { name: `PATCH /api/users/${userId}/activate`, url: `${base}/activate`, opts: { method: 'PATCH', headers: authHeader } },
      { name: `PATCH /api/users/${userId}/role`, url: `${base}/role`, opts: { method: 'PATCH', headers: authHeader, body: JSON.stringify({ role: 'staff' }) } },
      { name: `GET /api/users/${userId}`, url: base, opts: { method: 'GET', headers: authHeader } },
      { name: `DELETE /api/users/${userId}`, url: base, opts: { method: 'DELETE', headers: authHeader } }
    ];

    for (const action of actions) {
      const resp = await fetch(action.url, action.opts);
      const data = await resp.json().catch(() => null);
      console.log(`${action.name} ->`, resp.status, data);
    }

  } catch (error) {
    console.error('Test script error', error);
  }
})();
