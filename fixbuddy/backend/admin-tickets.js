async function loadAllTickets() {
  const res = await fetch('http://localhost:3000/api/tickets');
  const tickets = await res.json();
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
  document.getElementById('adminTicketsTable').innerHTML = html;
}
window.onload = loadAllTickets;