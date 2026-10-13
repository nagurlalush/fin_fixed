/**
 * CreatorVerse AI - Platform Administrator & Governance Controller
 * Manages Verification Audits, AI Heuristic Evaluations, Creator Approvals, and User Accounts.
 */

let activeVerifFilter = 'all';
let activeCreatorFilter = 'all';

async function loadAdminData() {
  if (!currentUser || currentUser.role !== 'admin') return;
  await Promise.all([
    loadAdminStats(),
    loadAdminVerificationQueue(activeVerifFilter),
    loadAdminCreatorsList(activeCreatorFilter),
    loadAdminUsersList()
  ]);
}

async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const stats = await res.json();

    const pendingEl = document.getElementById('adStatPending');
    if (pendingEl) pendingEl.innerText = stats.pending_verifications || 0;

    const creatorsEl = document.getElementById('adStatCreators');
    if (creatorsEl) creatorsEl.innerText = stats.creators_count || 0;

    const brandsEl = document.getElementById('adStatBrands');
    if (brandsEl) brandsEl.innerText = stats.brands_count || 0;

    const verifCreatorsEl = document.getElementById('adStatVerifiedCreators');
    if (verifCreatorsEl) verifCreatorsEl.innerText = stats.verified_creators || 0;
  } catch (err) {
    console.error("Error loading admin stats:", err);
  }
}

// -------------------------------------------------------------
// 1. CREATOR VERIFICATION REVIEW QUEUE (WITH FILTERS)
// -------------------------------------------------------------
function filterAdminQueue(status, e) {
  activeVerifFilter = status;
  if (e && e.target) {
    e.target.parentElement.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
  }
  loadAdminVerificationQueue(status);
}

async function loadAdminVerificationQueue(status = 'all') {
  const container = document.getElementById('adminVerifQueue');
  if (!container) return;

  try {
    const url = status && status !== 'all' ? `/api/admin/verifications?status=${status}` : '/api/admin/verifications';
    const res = await fetch(url);
    const records = await res.json();

    if (!records || records.length === 0) {
      container.innerHTML = `<p style="color:var(--text-dim); padding:1rem 0;">No ${status !== 'all' ? status : ''} verification records found in platform audit queue.</p>`;
      return;
    }

    container.innerHTML = records.map(r => `
      <div style="border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1rem; background:var(--bg-surface);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-weight:700; font-size:1.05rem;">${r.title}</div>
            <div style="font-size:0.8rem; color:var(--cyan); margin-top:2px;">
              Creator: <strong>${r.creator_name}</strong> (${r.creator_email}) • Type: ${(r.evidence_type || 'workflow').toUpperCase()}
            </div>
          </div>
          <div>
            ${r.status === 'approved' ? '<span class="badge badge-success">✓ Approved / Verified</span>' : (r.status === 'rejected' ? '<span class="badge badge-danger">✕ Rejected</span>' : '<span class="badge badge-warning">⏳ Audit Required</span>')}
            <span class="badge badge-cyan" style="margin-left:6px;">AI Heuristic Confidence: ${r.confidence_score || 95}%</span>
          </div>
        </div>

        <p style="font-size:0.85rem; color:var(--text-muted);">${r.description}</p>

        <div style="background:var(--bg-main); border:1px solid var(--border-subtle); border-radius:4px; padding:6px 12px; font-size:0.775rem; margin-top:8px;">
          <strong>Evidence Link:</strong> <a href="${r.evidence_url}" target="_blank" style="color:var(--primary); word-break:break-all;">${r.evidence_url}</a>
        </div>

        ${r.audit_notes ? `
          <div style="font-size:0.8rem; color:#93C5FD; margin-top:8px; background:rgba(59,130,246,0.08); padding:8px 10px; border-radius:4px;">
            <strong>Audit Record:</strong> ${r.audit_notes}
          </div>
        ` : ''}

        <div style="margin-top:12px; display:flex; gap:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; flex-wrap:wrap;">
          ${r.status !== 'approved' ? `
            <button class="btn btn-primary btn-sm" onclick="reviewVerificationRecord(${r.id}, 'approved')">✓ Approve Credential</button>
          ` : ''}
          ${r.status !== 'rejected' ? `
            <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.4);" onclick="reviewVerificationRecord(${r.id}, 'rejected')">✕ Reject Credential</button>
          ` : ''}
          <button class="btn btn-outline btn-sm" onclick="promptAuditNote(${r.id})">📝 Add Audit Note</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading admin verification queue:", err);
  }
}

async function reviewVerificationRecord(recordId, decision) {
  const notes = prompt(`Enter administrative note for ${decision}:`, decision === 'approved' ? 'Verified ComfyUI node graph and tool subscription validity.' : 'Insufficient reproducible evidence provided.');
  if (notes === null) return;

  try {
    const res = await fetch(`/api/admin/verifications/${recordId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadAdminVerificationQueue(activeVerifFilter);
      loadAdminCreatorsList(activeCreatorFilter);
      loadAdminStats();
    } else {
      showToast(data.message || 'Error updating record', 'error');
    }
  } catch (err) {
    showToast('Failed to review verification record', 'error');
  }
}

async function promptAuditNote(recordId) {
  const note = prompt("Enter administrative audit notes to attach to this verification record:");
  if (!note) return;
  reviewVerificationRecord(recordId, 'approved');
}

// -------------------------------------------------------------
// 2. CREATOR ACCOUNTS DIRECT VERIFICATION & APPROVAL MANAGEMENT
// -------------------------------------------------------------
function filterAdminCreators(status, e) {
  activeCreatorFilter = status;
  if (e && e.target) {
    e.target.parentElement.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
  }
  loadAdminCreatorsList(status);
}

async function loadAdminCreatorsList(status = 'all') {
  const container = document.getElementById('adminCreatorsApprovalList');
  if (!container) return;

  try {
    const url = status && status !== 'all' ? `/api/admin/creators?status=${status}` : '/api/admin/creators';
    const res = await fetch(url);
    if (!res.ok) return;
    const creators = await res.json();

    if (!creators || creators.length === 0) {
      container.innerHTML = `<p style="color:var(--text-dim); padding:1rem 0;">No ${status !== 'all' ? status : ''} creator accounts found.</p>`;
      return;
    }

    container.innerHTML = creators.map(c => {
      const isVerified = c.verified_status === 'verified';
      const isPending = c.verified_status === 'submitted' || c.verified_status === 'pending' || c.verified_status === 'unverified';
      const isRejected = c.verified_status === 'rejected';

      const statusBadge = isVerified 
        ? '<span class="badge badge-success">✓ Verified & Approved</span>' 
        : (isRejected ? '<span class="badge badge-danger">✕ Rejected</span>' : '<span class="badge badge-warning">⏳ Awaiting Admin Approval</span>');

      return `
        <div style="border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1rem; background:var(--bg-surface);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <img src="${c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--border-subtle);">
              <div>
                <div style="font-weight:700; font-size:1.05rem;">${c.full_name} <span style="font-size:0.8rem; color:var(--text-dim); font-weight:normal;">(${c.email})</span></div>
                <div style="font-size:0.825rem; color:var(--cyan); margin-top:2px;">
                  Specialization: <strong>${c.specialization || 'AI Video'}</strong> • Day Rate: $${c.day_rate || 450} • ★ ${c.rating || 5.0}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                  Toolchains: ${(c.tools_models || 'ComfyUI, Runway Gen-3').replace(/[\[\]"']/g, '')}
                </div>
              </div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; justify-content:flex-end; flex-wrap:wrap; align-items:center;">
            ${!isVerified ? `
              <button class="btn btn-primary btn-sm" onclick="adminVerifyCreator(${c.profile_id}, 'verified')">
                ✓ Approve Creator
              </button>
            ` : ''}
            ${!isRejected ? `
              <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.4);" onclick="adminVerifyCreator(${c.profile_id}, 'rejected')">
                ✕ Reject / Revoke
              </button>
            ` : ''}
            ${isVerified ? `
              <span style="font-size:0.75rem; color:#34D399; font-weight:600;">✓ Approved & Cleared for Commercial Marketplace</span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading creators list:", err);
  }
}

async function adminVerifyCreator(profileId, newStatus) {
  try {
    const res = await fetch(`/api/admin/creators/${profileId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadAdminCreatorsList(activeCreatorFilter);
      loadAdminVerificationQueue(activeVerifFilter);
      loadAdminStats();
    } else {
      showToast(data.error || 'Failed to update creator verification', 'error');
    }
  } catch (err) {
    showToast('Network error updating creator verification', 'error');
  }
}

// -------------------------------------------------------------
// 3. ADMIN AUTOMATION FUNCTIONS & HEURISTIC AUDIT
// -------------------------------------------------------------
async function runAdminBatchAudit() {
  try {
    showToast('Running automated AI heuristic toolchain audit across pending submissions...', 'info');
    const res = await fetch('/api/admin/batch-heuristic-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadAdminData();
    } else {
      showToast(data.error || 'Batch audit failed', 'error');
    }
  } catch (err) {
    showToast('Network error running batch audit', 'error');
  }
}

// -------------------------------------------------------------
// 4. USERS DIRECTORY
// -------------------------------------------------------------
async function loadAdminUsersList() {
  const container = document.getElementById('adminUsersList');
  if (!container) return;

  try {
    const res = await fetch('/api/admin/users');
    const users = await res.json();

    container.innerHTML = users.map(u => `
      <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.75rem 1rem; margin-bottom:0.5rem; background:var(--bg-main);">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-weight:700; font-size:0.9rem;">${u.full_name} <span style="font-size:0.75rem; color:var(--text-dim); font-weight:normal;">(${u.email})</span></div>
            <div style="font-size:0.75rem; color:var(--cyan);">${u.role.toUpperCase()}</div>
          </div>
        </div>
        <div>
          <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Suspended'}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading users list:", err);
  }
}

// -------------------------------------------------------------
// 5. DASHBOARD FUNCTIONS & DIRECT NAVIGATION
// -------------------------------------------------------------
function jumpToPendingVerifications() {
  const btn = document.getElementById('btnAdminFilterPending');
  if (btn) btn.click();
  const target = document.getElementById('adminVerifQueue');
  if (target) target.scrollIntoView();
}

function jumpToPendingCreators() {
  const btn = document.getElementById('btnAdminCreatorPending');
  if (btn) btn.click();
  const target = document.getElementById('adminCreatorsApprovalList');
  if (target) target.scrollIntoView();
}

function jumpToVerifiedCreators() {
  const btn = document.getElementById('btnAdminCreatorVerified');
  if (btn) btn.click();
  const target = document.getElementById('adminCreatorsApprovalList');
  if (target) target.scrollIntoView();
}

function jumpToUsersDirectory() {
  const target = document.getElementById('adminUsersList');
  if (target) target.scrollIntoView();
}

async function exportAdminAuditSummary() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    const stats = await res.json();
    const summaryText = `CreatorVerse AI - Governance Audit Summary\n` +
      `----------------------------------------\n` +
      `• Total Registered Creators: ${stats.creators_count || 0}\n` +
      `• Verified & Cleared Talent: ${stats.verified_creators || 0}\n` +
      `• Pending Verification Audits: ${stats.pending_verifications || 0}\n` +
      `• Total Brand / Agency Partners: ${stats.brands_count || 0}\n` +
      `• Active Campaign Briefs: ${stats.briefs_count || 0}\n` +
      `• Marketplace Audit Shield: ACTIVE & ENFORCED\n` +
      `• Timestamp: ${new Date().toLocaleString()}`;
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(summaryText);
    }
    showToast('Platform Audit Summary generated & copied to clipboard!', 'success');
  } catch (err) {
    showToast('Failed to generate audit summary', 'error');
  }
}

