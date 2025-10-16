document.getElementById('ticketForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const user_id = 1; // Replace with actual logged-in user id
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  const res = await fetch('http://localhost:3000/api/tickets', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ user_id, title, description })
  });
  let result;
  try {
    result = await res.json();
  } catch (e) {
    result = { success: false, message: 'No response or invalid JSON from server.' };
  }
  if (result.success) {
    document.getElementById('ticketMessage').textContent = 'Submitted';
    // Optionally redirect after a short delay
    setTimeout(() => {
      window.location.href = '/UserDashboard/mytickets.html';
    }, 1200);
  } else {
    document.getElementById('ticketMessage').textContent = result.message || 'Failed to submit ticket.';
  }
});