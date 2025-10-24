// View My Tickets - offline-first
(function(){
  const LOCAL_KEY = 'fixbuddy_tickets';
  const ticketListEl = document.getElementById('ticketList');
  const refreshBtn = document.getElementById('refreshBtn');

  function setYear(){
    try{ document.getElementById('year').textContent = new Date().getFullYear(); }catch(e){}
  }

  function loadFromCache(){
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveToCache(tickets){
    try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets)); }catch(e){console.warn('Failed to save cache',e)}
  }

  function renderTickets(tickets){
    ticketListEl.innerHTML = '';
    if(!tickets || tickets.length === 0){
      ticketListEl.innerHTML = '<p class="muted">No tickets found.</p>';
      return;
    }

    tickets.forEach(t => {
      const card = document.createElement('article');
      card.className = 'ticket-card';
      card.dataset.ticket = JSON.stringify(t);
      card.innerHTML = `
        <h3>${escapeHtml(t.title || 'Untitled')}</h3>
        <p class="desc">${escapeHtml(t.description || '')}</p>
        <p class="meta">Status: <span class="status ${(t.status||'').toLowerCase()}">${escapeHtml(t.status||'Unknown')}</span></p>
        <p class="meta"><small>Created: ${new Date(t.date || t.created_at || Date.now()).toLocaleString()}</small></p>
        <p><button class="btn btn-secondary view-details">View Details</button></p>
      `;
      ticketListEl.appendChild(card);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c]));
  }

  async function fetchOnline(){
    try{
      // Fetch from backend endpoint (express or php equivalent)
      const res = await fetch('../backend/getTickets');
      if(!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      saveToCache(data);
      renderTickets(data);
    }catch(err){
      console.info('Offline or fetch failed, using cache', err);
      renderTickets(loadFromCache());
    }
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    setYear();
    renderTickets(loadFromCache());
    fetchOnline();
  });

  if(refreshBtn){ refreshBtn.addEventListener('click', fetchOnline); }

  // Modal wiring
  const modal = document.getElementById('ticketModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalStatus = document.getElementById('modalStatus');

  function openModalForTicket(ticket){
    modalTitle.textContent = ticket.title || 'Untitled';
    modalDesc.textContent = ticket.description || '';
    modalStatus.textContent = ticket.status || 'Unknown';
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden','false');
  }

  function closeModal(){
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
  }

  ticketListEl.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('.view-details');
    if(!btn) return;
    const card = btn.closest('.ticket-card');
    if(!card) return;
    try{ const ticket = JSON.parse(card.dataset.ticket||'{}'); openModalForTicket(ticket); }catch(e){ console.warn(e); }
  });

  if(modalClose) modalClose.addEventListener('click', closeModal);


})();
