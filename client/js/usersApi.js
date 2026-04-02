const API_BASE = 'http://localhost:5000/api';
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
        if (e.target.closest('.fa-lock')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleSuspendUser(userId);
        }
        if (e.target.closest('.fa-user-times')) {
            const row = e.target.closest('tr');
            const userId = row.querySelector('td').textContent.match(/\d+/)[0];
            handleDeleteUser(userId);
        }
    });
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load users');
        
        const result = await response.json();
        usersData = result.data;
        renderUsersTable(usersData);
        showNotification('Users loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Render users in table
function renderUsersTable(users) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users found</td></tr>';
        return;
    }

    users.forEach((user, index) => {
        const statusBadge = user.isActive 
            ? '<span class="user-status-badge active">Active</span>'
            : '<span class="user-status-badge suspended">Suspended</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#U${String(user.id).padStart(3, '0')}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
            <td>${statusBadge}</td>
            <td class="action-icons">
                <a href="#" title="Edit User" data-id="${user.id}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </a>
                <a href="#" title="${user.isActive ? 'Suspend' : 'Activate'} User" data-id="${user.id}">
                    <i class="fa-solid fa-lock"></i>
                </a>
                <a href="#" title="Remove User" data-id="${user.id}">
                    <i class="fa-solid fa-user-times"></i>
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
        const response = await fetch(`${API_BASE}/users/search?query=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Search failed');
        
        const result = await response.json();
        renderUsersTable(result.data);
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
                <label>Name</label>
                <input type="text" id="newUserName" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="newUserEmail" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select id="newUserRole">
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="newUserPassword" required>
            </div>
        </form>
    `, async () => {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;

        try {
            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, role, password })
            });

            if (!response.ok) throw new Error('Failed to create user');
            
            showNotification('User created successfully', 'success');
            loadUsers();
            modal.remove();
        } catch (error) {
            showNotification('Error creating user', 'error');
        }
    });
}

// Handle edit user
function handleEditUser(userId) {
    const user = usersData.find(u => u.id === parseInt(userId));
    if (!user) return;

    const modal = createModal('Edit User', `
        <form id="editUserForm">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="editUserName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="editUserEmail" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select id="editUserRole">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
        </form>
    `, async () => {
        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;

        try {
            const response = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ name, email, role })
            });

            if (!response.ok) throw new Error('Failed to update user');
            
            showNotification('User updated successfully', 'success');
            loadUsers();
            modal.remove();
        } catch (error) {
            showNotification('Error updating user', 'error');
        }
    });
}

// Handle suspend user
async function handleSuspendUser(userId) {
    const user = usersData.find(u => u.id === parseInt(userId));
    if (!user) return;

    const action = user.isActive ? 'suspend' : 'activate';
    const endpoint = user.isActive ? 'suspend' : 'activate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}/${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error(`Failed to ${action} user`);
        
        showNotification(`User ${action}ed successfully`, 'success');
        loadUsers();
    } catch (error) {
        showNotification(`Error ${action}ing user`, 'error');
    }
}

// Handle delete user
async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');
        
        showNotification('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showNotification('Error deleting user', 'error');
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
        <div style="background: white; padding: 2rem; border-radius: 8px; min-width: 400px;">
            <h2>${title}</h2>
            ${content}
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="this.closest('[style*=position]').remove()" style="padding: 0.5rem 1rem; cursor: pointer;">Cancel</button>
                <button id="confirmBtn" style="padding: 0.5rem 1rem; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px;">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirmBtn').addEventListener('click', onConfirm);
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