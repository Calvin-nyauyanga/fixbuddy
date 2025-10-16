async function loadMyTickets() {
  const user_id = 1; // Replace with actual logged-in user id
  const res = await fetch(`http://localhost:3000/api/tickets?user_id=${user_id}`);
  const tickets = await res.json();
  // Render tickets to your table/list
  let html = '';
  tickets.forEach(ticket => {
    html += `<tr>
      <td>${ticket.id}</td>
      <td>${ticket.title}</td>
      <td>${ticket.description}</td>
      <td>${ticket.status}</td>
      <td>${ticket.created_at}</td>
    </tr>`;
  });
  document.getElementById('ticketsTable').innerHTML = html;
}
window.onload = loadMyTickets;