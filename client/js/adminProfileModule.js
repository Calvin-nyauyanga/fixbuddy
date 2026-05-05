/**
 * Admin Profile Module - Shared functionality for admin pages
 * Handles profile dropdown, modals, and profile management
 */

// ========== UPDATE PROFILE DISPLAY ==========
function updateProfileDisplay() {
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    if (!admin) return;

    const name = admin.name || admin.email || 'Admin';
    const email = admin.email || 'admin@fixbuddy.com';
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);

    // Update dropdown if it exists
    if (document.getElementById('profileAvatar')) {
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;
        document.getElementById('profileAvatar').textContent = initials;
    }

    // Update modal if it exists
    if (document.getElementById('modalProfileAvatar')) {
        document.getElementById('modalProfileName').textContent = name;
        document.getElementById('modalProfileEmail').textContent = email;
        document.getElementById('modalProfileRole').textContent = (admin.role || 'admin').toUpperCase();
        document.getElementById('modalProfileEmailDetail').textContent = email;
        document.getElementById('modalProfileRoleDetail').textContent = admin.role || 'Admin';
        document.getElementById('modalProfileAvatar').textContent = initials;

        // Set joined date
        if (admin.createdAt) {
            const joinedDate = new Date(admin.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            document.getElementById('modalProfileJoined').textContent = joinedDate;
        }
    }
}

// ========== PROFILE MODAL FUNCTIONS ==========
function openProfileModal() {
    if (document.getElementById('profileDropdown')) {
        document.getElementById('profileDropdown').classList.remove('show');
    }
    updateProfileDisplay();
    document.getElementById('profileViewModal').classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profileViewModal').classList.remove('show');
}

function openEditProfileModal() {
    if (document.getElementById('profileDropdown')) {
        document.getElementById('profileDropdown').classList.remove('show');
    }
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    if (!admin) return;

    document.getElementById('editProfileName').value = admin.name || '';
    document.getElementById('editProfileEmail').value = admin.email || '';
    document.getElementById('editProfilePhone').value = admin.phone || '';
    document.getElementById('editProfilePassword').value = '';

    document.getElementById('editProfileModal').classList.add('show');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

async function submitEditProfileForm(event) {
    event.preventDefault();

    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    if (!admin || !admin.id) {
        showNotification('❌ Admin session not found', 'error');
        return;
    }

    const userData = {
        name: document.getElementById('editProfileName').value,
        email: document.getElementById('editProfileEmail').value,
        phone: document.getElementById('editProfilePhone').value
    };

    // Only include password if provided
    if (document.getElementById('editProfilePassword').value) {
        userData.password = document.getElementById('editProfilePassword').value;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/users/${admin.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        // Update local storage
        const updatedAdmin = { ...admin, ...userData };
        delete updatedAdmin.password;
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));

        showNotification('✅ Profile updated successfully!', 'success');
        closeEditProfileModal();
        updateProfileDisplay();
        if (document.getElementById('adminWelcome')) {
            document.getElementById('adminWelcome').textContent = `👤 ${updatedAdmin.name || updatedAdmin.email}`;
        }
    } catch (error) {
        showNotification(`❌ Failed to update profile: ${error.message}`, 'error');
    }
}

function goToSettings() {
    if (document.getElementById('profileDropdown')) {
        document.getElementById('profileDropdown').classList.remove('show');
    }
    window.location.href = 'settings.html';
}

function logoutUser() {
    if (document.getElementById('profileDropdown')) {
        document.getElementById('profileDropdown').classList.remove('show');
    }
    logout();
}

// ========== SETUP PROFILE DROPDOWN ==========
function setupProfileDropdown() {
    const profileIcon = document.querySelector('.admin-profile-icon');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (!profileIcon || !profileDropdown) return;

    profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    updateProfileDisplay();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', setupProfileDropdown);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProfileDropdown);
} else {
    setupProfileDropdown();
}
