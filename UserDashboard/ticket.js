// Wait until the page and form elements are loaded
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("ticketForm");
  const messageDiv = document.getElementById("ticketMessage");

  // Listen for form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent page reload

    // --- 1️⃣ Validate Input ---
    const title = form.title.value.trim();
    const description = form.description.value.trim();

    if (!title || !description) {
      showMessage("⚠️ Please fill in both the title and description.", "error");
      return;
    }

    // --- 2️⃣ Create a ticket object ---
    const ticket = {
      id: Date.now(), // unique ID based on timestamp
      title: title,
      description: description,
      createdAt: new Date().toLocaleString(),
      status: "Pending", // default status
    };

    // --- 3️⃣ Retrieve existing tickets from localStorage ---
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];

    // --- 4️⃣ Add the new ticket to the list ---
    tickets.push(ticket);

    // --- 5️⃣ Save the updated list back to localStorage ---
    localStorage.setItem("tickets", JSON.stringify(tickets));

    // --- 6️⃣ Show success message ---
    showMessage("✅ Ticket saved locally! You can view it later in your dashboard.", "success");

    // --- 7️⃣ Clear the form ---
    form.reset();
  });

  // --- Helper function to display messages ---
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.style.padding = "10px";
    messageDiv.style.marginTop = "10px";
    messageDiv.style.borderRadius = "6px";

    if (type === "success") {
      messageDiv.style.backgroundColor = "#d4edda";
      messageDiv.style.color = "#155724";
      messageDiv.style.border = "1px solid #c3e6cb";
    } else if (type === "error") {
      messageDiv.style.backgroundColor = "#f8d7da";
      messageDiv.style.color = "#721c24";
      messageDiv.style.border = "1px solid #f5c6cb";
    }
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const ticketList = document.getElementById("ticketList");
  const tickets = JSON.parse(localStorage.getItem("tickets")) || [];

  if (tickets.length === 0) {
    ticketList.innerHTML = "<p>No tickets found.</p>";
  } else {
    ticketList.innerHTML = tickets
      .map(
        (t) => `
        <div class="ticket-card">
          <h3>${t.title}</h3>
          <p>${t.description}</p>
          <small>📅 ${t.createdAt} — <strong>${t.status}</strong></small>
        </div>
      `
      )
      .join("");
  }
});