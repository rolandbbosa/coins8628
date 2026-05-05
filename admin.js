const adminAllowedEmails = ['college@gmail.com'];

// Admin email set for Firebase Auth.
// Create the Firebase Auth user manually with this email and the password @1234@.
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}

function createCsvContent(rows) {
  const headers = ['ID', 'Name', 'DOB', 'Country', 'Bitcoin Address', 'Email', 'Phone', 'Submitted At'];
  const csvRows = [headers.join(',')];
  rows.forEach((row) => {
    const values = [
      row.id,
      `"${row.name}"`,
      row.dob,
      `"${row.country}"`,
      `"${row.bitcoinAddress}"`,
      row.email,
      row.phone,
      row.submittedAt,
    ];
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
}

function downloadCsv(rows) {
  const blob = new Blob([createCsvContent(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'claims.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadClaims() {
  const body = document.getElementById('claims-body');
  const countLabel = document.getElementById('claims-count');
  if (!body || !countLabel) return;

  try {
    const snapshot = await db.collection('claims').orderBy('createdAt', 'desc').get();
    const rows = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        dob: data.dob || '-',
        country: data.country || '-',
        bitcoinAddress: data.bitcoinAddress || '-',
        email: data.email || '-',
        phone: data.phone || '-',
        submittedAt: formatDate(data.createdAt),
      };
    });

    countLabel.textContent = rows.length.toString();
    body.innerHTML = rows.length
      ? rows.map((row, index) => `<tr>
          <td>${index + 1}</td>
          <td>${row.name}</td>
          <td>${row.dob}</td>
          <td>${row.country}</td>
          <td>${row.bitcoinAddress}</td>
          <td>${row.email}</td>
          <td>${row.phone}</td>
          <td>${row.submittedAt}</td>
        </tr>`).join('')
      : '<tr><td colspan="8" style="padding: 1.5rem 0; color: var(--muted);">No claims available.</td></tr>';

    // Update button handlers with current data
    const copyBtn = document.getElementById('copy-emails');
    const downloadBtn = document.getElementById('download-csv');
    
    if (copyBtn) {
      copyBtn.onclick = () => {
        const emailText = rows.map(r => r.email).filter(Boolean).join(', ');
        navigator.clipboard.writeText(emailText).then(() => alert('Emails copied to clipboard.'));
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => downloadCsv(rows);
    }
  } catch (error) {
    console.error('Unable to load claims', error);
    body.innerHTML = '<tr><td colspan="8" style="padding: 1.5rem 0; color: var(--muted);">Unable to load claims. Check your Firebase settings and admin permissions.</td></tr>';
  }
}

function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    if (!email || !password) {
      errorBox.style.display = 'block';
      errorBox.textContent = 'Please enter both email and password.';
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';
    } catch (error) {
      errorBox.style.display = 'block';
      errorBox.textContent = error.message || 'Login failed. Please check credentials.';
    }
  });
}

function initDashboardPage() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    if (!adminAllowedEmails.includes(user.email)) {
      auth.signOut();
      window.location.href = 'login.html';
      return;
    }

    loadClaims();
  });

  document.getElementById('sign-out')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'login.html';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initDashboardPage();
});
