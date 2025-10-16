// This function is the callback for Google Sign-In. It needs to be accessible globally.
function handleCredentialResponse(response) {
    const loginMessage = document.getElementById('loginMessage');
    console.log('Google credential:', response.credential);

    if (!response.credential) {
        loginMessage.textContent = "No Google credential received. Please try again.";
        return;
    }

    fetch('http://localhost:3000/api/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = "../UserDashboard/UserDashboard.html";
        } else {
            loginMessage.textContent = data.message || "Google sign in failed.";
        }
    })
    .catch(error => {
        console.error('Error during Google sign-in fetch:', error);
        loginMessage.textContent = "Could not connect to the server for Google Sign-In.";
    });
}

// Wait until the entire HTML document is loaded and ready before running scripts.
document.addEventListener('DOMContentLoaded', () => {

    // --- Standard Email/Password Form Logic ---
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent page refresh
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('loginMessage');
            msg.textContent = "";

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = '../UserDashboard/UserDashboard.html';
                } else {
                    msg.textContent = data.message || 'Email or password is incorrect.';
                }
            } catch (err) {
                console.error('Error during login fetch:', err);
                msg.textContent = "Error connecting to the server. Please try again.";
            }
        });
    }

    // --- Google Sign-In Initialization ---
    // Check if the Google library is loaded
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "302019067009-t7ghuccd6oj44goe6frob9s0sunu0d63.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });

        // The container where the Google button will be rendered.
        const googleButtonContainer = document.querySelector('.g_id_signin');
        if (googleButtonContainer) {
            google.accounts.id.renderButton(
                googleButtonContainer,
                { theme: "outline", size: "large" }
            );
        }
    } else {
        console.error("Google Sign-In library not loaded.");
    }
    
    // --- Footer Year Logic ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});