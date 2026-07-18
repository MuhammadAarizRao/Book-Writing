// =========================================================
// CRM DASHBOARD
// Handles Supabase Auth login/logout and the submissions
// table: fetching, searching, filtering, status updates,
// and deleting entries. Requires supabase-config.js to be
// filled in with your project's URL + anon key.
// =========================================================

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

let allSubmissions = [];

// ---------- Auth ----------

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.style.display = 'flex';
  dashboard.style.display = 'none';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'block';
  loadSubmissions();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.classList.remove('show');

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.add('show');
    return;
  }
  showDashboard();
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

// ---------- Data loading ----------

async function loadSubmissions() {
  const tbody = document.getElementById('crm-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">Loading…</td></tr>';

  const { data, error } = await supabaseClient
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#b3261e;">Error loading submissions: ${error.message}</td></tr>`;
    return;
  }

  allSubmissions = data || [];
  updateStats();
  renderTable();
}

function updateStats() {
  document.getElementById('stat-total').textContent = allSubmissions.length;
  document.getElementById('stat-new').textContent = allSubmissions.filter((s) => s.status === 'new').length;
  document.getElementById('stat-contacted').textContent = allSubmissions.filter((s) => s.status === 'contacted').length;
  document.getElementById('stat-closed').textContent = allSubmissions.filter((s) => s.status === 'closed').length;
}

// ---------- Rendering ----------

function formatDate(iso) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart}<br>${timePart}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderTable() {
  const tbody = document.getElementById('crm-table-body');
  const emptyState = document.getElementById('crm-empty');
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  const filtered = allSubmissions.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const haystack = `${s.name} ${s.email} ${s.message}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesStatus && matchesSearch;
  });

  if (!filtered.length) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map((s) => `
    <tr data-id="${s.id}">
      <td class="date-cell">${formatDate(s.created_at)}</td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(s.email)}${s.phone ? '<br>' + escapeHtml(s.phone) : ''}</td>
      <td>${escapeHtml(s.subject) || '—'}${s.service ? '<br><span style="color:var(--muted);font-size:.8rem;">' + escapeHtml(s.service) + '</span>' : ''}</td>
      <td class="msg-cell${s.message && s.message.length > 160 ? ' truncated' : ''}" title="Click to expand">${escapeHtml(s.message)}</td>
      <td>
        <select class="status-badge ${s.status}" data-id="${s.id}">
          <option value="new" ${s.status === 'new' ? 'selected' : ''}>New</option>
          <option value="contacted" ${s.status === 'contacted' ? 'selected' : ''}>Contacted</option>
          <option value="closed" ${s.status === 'closed' ? 'selected' : ''}>Closed</option>
        </select>
      </td>
      <td><button class="crm-delete" data-id="${s.id}" aria-label="Delete submission" title="Delete">&times;</button></td>
    </tr>
  `).join('');

  // Status change -> update in Supabase
  // Click a truncated message to expand/collapse it in place
  tbody.querySelectorAll('.msg-cell.truncated').forEach((cell) => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      cell.classList.toggle('expanded');
      cell.style.maxHeight = cell.classList.contains('expanded') ? 'none' : '4.5em';
    });
  });

  tbody.querySelectorAll('select.status-badge').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      e.target.className = 'status-badge ' + newStatus;

      const { error } = await supabaseClient
        .from('contact_submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        alert('Could not update status: ' + error.message);
        return;
      }
      const item = allSubmissions.find((s) => s.id === id);
      if (item) item.status = newStatus;
      updateStats();
    });
  });

  // Delete row
  tbody.querySelectorAll('.crm-delete').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (!confirm('Delete this submission? This cannot be undone.')) return;

      const { error } = await supabaseClient
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Could not delete: ' + error.message);
        return;
      }
      allSubmissions = allSubmissions.filter((s) => s.id !== id);
      updateStats();
      renderTable();
    });
  });
}

document.getElementById('search-input').addEventListener('input', renderTable);
document.getElementById('status-filter').addEventListener('change', renderTable);
document.getElementById('refresh-btn').addEventListener('click', loadSubmissions);

checkSession();