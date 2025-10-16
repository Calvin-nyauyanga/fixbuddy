async function loadActivities() {
  const res = await fetch('http://localhost:3000/api/recent-activities');
  const activities = await res.json();
  let html = '';
  activities.forEach(act => {
    html += `<li>${act.message} <small>${act.created_at}</small></li>`;
  });
  document.getElementById('recentActivities').innerHTML = html;
}
window.onload = loadActivities;