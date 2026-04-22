const USERS_API_BASE = 'http://localhost:5000/api';
let usersData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Add New User button
    const addUserBtn = document.querySelector('.btn-primary');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', handleAddUser);
    }

    // Action icons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.fa-pen-to-square')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleEditUser(userId);
        }
        if (e.target.closest('.fa-ban')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleSuspendUser(userId);
        }
        if (e.target.closest('.fa-circle-check')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleActivateUser(userId);
        }
        if (e.target.closest('.fa-trash')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleDeleteUser(userId);
        }
    });
}

// Get auth token - handle both 'authToken' and 'adminToken'
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('adminToken');
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch(`${USERS_API_BASE}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to load users');
        
        const result = await response.json();
        usersData = result.data?.users || result.data || [];
        renderUsersTable(usersData);
        // Only show notification after first load
        if (usersData.length > 0) {
            console.log('✅ Users loaded successfully');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Render users in table
function renderUsersTable(users) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
        console.error('Table tbody not found');
        return;
    }

    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';
        return;
    }

    users.forEach((user) => {
        // Determine status - check if user has a status field or use active state
        const isActive = user.status !== 'suspended' && user.status !== 'inactive';
        const statusBadge = isActive 
            ? '<span class="user-status-badge active">Active</span>'
            : '<span class="user-status-badge suspended">Suspended</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#U${String(user.id).padStart(3, '0')}</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${(user.role || 'user').charAt(0).toUpperCase() + (user.role || 'user').slice(1)}</td>
            <td>${statusBadge}</td>
            <td>${new Date(user.createdAt).toLocaleDateString() || 'N/A'}</td>
            <td class="action-icons">
                <a href="#" onclick="return false;" title="Edit User" data-id="${user.id}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </a>
                <a href="#" onclick="return false;" title="${isActive ? 'Suspend' : 'Activate'} User" data-id="${user.id}">
                    <i class="fa-solid fa-${isActive ? 'ban' : 'circle-check'}"></i>
                </a>
                <a href="#" onclick="return false;" title="Delete User" data-id="${user.id}">
                    <i class="fa-solid fa-trash"></i>
                </a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Search users
async function handleSearch(e) {
    const query = e.target.value;

    if (!query) {
        renderUsersTable(usersData);
        return;
    }

    try {
        const response = await fetch(`${USERS_API_BASE}/users/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) throw new Error('Search failed');
        
        const result = await response.json();
        const searchResults = result.data?.users || result.data || [];
        renderUsersTable(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed', 'error');
    }
}

// Handle add new user
function handleAddUser() {
    const modal = createModal('Add New User', `
        <form id="addUserForm">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="newUserName" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="newUserEmail" required>
            </div>
            <div class="form-group">
                <label>Role *</label>
                <select id="newUserRole" required>
                    <option value="">-- Select Role --</option>
                    <option value="user">User</option>
                    <option value="staff">Staff/Agent</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" id="newUserPassword" required>
            </div>
        </form>
    `, async () => {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;

        if (!name || !email || !role || !password) {
            showNotification('All fields are required', 'error');
            return;
        }

        try {
            // Try the dedicated create user endpoint first
            // If it doesn't exist, your backend can return 404 and you can add it
            const response = await fetch(`${USERS_API_BASE}/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ name, email, role, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }
            
            showNotification('✅ User created successfully', 'success');
            loadUsers();
            modal.remove();
        } catch (error) {
            console.error('Error creating user:', error);
            showNotification(`❌ Error: ${error.message}`, 'error');
        }
    });
}

// Handle edit user
function handleEditUser(userId) {
    const user = usersData.find(u => u.id === parseInt(userId));
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }

    const modal = createModal('Edit User', `
        <form id="editUserForm">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="editUserName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="editUserEmail" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label>Role *</label>
                <select id="editUserRole" required>
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff/Agent</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
        </form>
    `, async () => {
        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;

        if (!name || !email || !role) {
            showNotification('All fields are required', 'error');
            return;
        }

        try {
            const response = await fetch(`${USERS_API_BASE}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ name, email, role })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update user');
            }
            
            showNotification('✅ User updated successfully', 'success');
            loadUsers();
            modal.remove();
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification(`❌ Error: ${error.message}`, 'error');
        }
    });
}

// Handle suspend user
async function handleSuspendUser(userId) {
    const user = usersData.find(u => u.id === parseInt(userId));
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }

    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
        const response = await fetch(`${USERS_API_BASE}/users/${userId}/suspend`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to suspend user');
        }
        
        showNotification('✅ User suspended successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error suspending user:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    }
}

// Handle activate user (new function)
async function handleActivateUser(userId) {
    const user = usersData.find(u => u.id === parseInt(userId));
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }

    if (!confirm('Are you sure you want to activate this user?')) return;

    try {
        const response = await fetch(`${USERS_API_BASE}/users/${userId}/activate`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to activate user');
        }
        
        showNotification('✅ User activated successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error activating user:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    }
}

// Handle delete user
async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${USERS_API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete user');
        }
        
        showNotification('✅ User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    }
}

// Utility: Create modal
function createModal(title, content, onConfirm) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; min-width: 400px; max-width: 90vw;">
            <h2 style="margin: 0 0 1.5rem 0; color: #333;">${title}</h2>
            ${content}
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 1rem;">
                <button class="btn-cancel" style="padding: 0.75rem 1.5rem; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 4px; font-weight: 600;">Cancel</button>
                <button id="confirmBtn" style="padding: 0.75rem 1.5rem; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; font-weight: 600;">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Cancel button
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());

    // Confirm button
    document.getElementById('confirmBtn').addEventListener('click', onConfirm);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    return modal;
}

// Utility: Show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: white;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        z-index: 10000;
        animation: slideIn 0.3s ease-in;
        max-width: 400px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Utility: Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}