/**
 * CreatorVerse AI - AI Creator Module Controller
 * Manages Creator Profile, AI Portfolio, Workflow Verification, and Brand Engagements.
 */

async function loadCreatorData() {
  if (!currentUser || currentUser.role !== 'creator') return;
  await Promise.all([
    loadCreatorStats(),
    loadCreatorProfileForm(),
    loadCreatorPortfolioItems(),
    loadCreatorVerificationRecords(),
    loadCreatorInvitations()
  ]);
}

function switchCreatorTab(tabId) {
  document.querySelectorAll('.creator-tab-panel').forEach(p => p.style.display = 'none');
  const btns = ['Studio', 'Portfolio', 'Verif', 'Invites'];
  btns.forEach(b => {
    const el = document.getElementById(`cSubTab${b}`);
    if (el) el.classList.remove('active');
  });

  if (tabId === 'studio') {
    document.getElementById('cTabContentStudio').style.display = 'block';
    document.getElementById('cSubTabStudio').classList.add('active');
  } else if (tabId === 'portfolio') {
    document.getElementById('cTabContentPortfolio').style.display = 'block';
    document.getElementById('cSubTabPortfolio').classList.add('active');
  } else if (tabId === 'verification') {
    document.getElementById('cTabContentVerif').style.display = 'block';
    document.getElementById('cSubTabVerif').classList.add('active');
  } else if (tabId === 'invitations') {
    document.getElementById('cTabContentInvites').style.display = 'block';
    document.getElementById('cSubTabInvites').classList.add('active');
  }
}

// -------------------------------------------------------------
// 1. STATS & PROFILE
// -------------------------------------------------------------
async function loadCreatorStats() {
  try {
    const res = await fetch('/api/creator/dashboard-stats');
    if (!res.ok) return;
    const stats = await res.json();
    
    document.getElementById('cStatActiveProjects').innerText = stats.active_projects || 0;
    document.getElementById('cStatPendingInvites').innerText = stats.pending_invitations || 0;
    document.getElementById('cStatEarnings').innerText = `$${(stats.total_earnings || 0).toLocaleString()}`;
    
    const verifEl = document.getElementById('cStatVerificationBadge');
    if (stats.is_verified) {
      verifEl.innerHTML = '<span class="badge badge-success">✓ Audited & Verified</span>';
    } else {
      verifEl.innerHTML = '<span class="badge badge-warning">⏳ Audit Pending</span>';
    }
  } catch (err) {
    console.error("Error loading creator stats:", err);
  }
}

async function loadCreatorProfileForm() {
  try {
    const res = await fetch('/api/creator/profile');
    if (!res.ok) return;
    const p = await res.json();
    
    document.getElementById('cpFullName').value = p.full_name || '';
    document.getElementById('cpSpecialization').value = p.specialization || '';
    document.getElementById('cpTools').value = p.ai_tools_list || '';
    document.getElementById('cpSkills').value = p.skills_list || '';
    document.getElementById('cpBio').value = p.bio || '';
    document.getElementById('cpDayRate').value = p.day_rate || 450;
    document.getElementById('cpAvailability').value = p.availability_status || 'available';
    document.getElementById('cpCommercialCheck').checked = Boolean(p.commercial_capabilities);

    if (p.avatar_url) {
      const avatarImg = document.getElementById('cpAvatarImg');
      if (avatarImg) avatarImg.src = p.avatar_url;
      const avatarUrlInput = document.getElementById('cpAvatarUrl');
      if (avatarUrlInput) avatarUrlInput.value = p.avatar_url;
    }
    const nameLabel = document.getElementById('cpPhotoDisplayName');
    if (nameLabel && p.full_name) {
      nameLabel.innerText = `${p.full_name}'s Profile Photo`;
    }

    // Check if creator is pending admin approval
    const pendingBanner = document.getElementById('creatorPendingApprovalBanner');
    if (pendingBanner) {
      if (p.verified_status !== 'verified') {
        pendingBanner.style.display = 'block';
      } else {
        pendingBanner.style.display = 'none';
      }
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

async function checkCreatorApprovalStatus() {
  try {
    const res = await fetch('/api/creator/profile');
    if (!res.ok) return;
    const p = await res.json();
    if (p.verified_status === 'verified') {
      showToast('🎉 Congratulations! Your creator account has been approved by the Administrator!', 'success');
      const banner = document.getElementById('creatorPendingApprovalBanner');
      if (banner) banner.style.display = 'none';
      loadCreatorStats();
    } else {
      showToast('Account is currently awaiting Administrator approval. Please keep waiting.', 'warning');
    }
  } catch (err) {
    showToast('Failed to check verification status', 'error');
  }
}

async function saveCreatorProfile() {
  const avatarUrl = document.getElementById('cpAvatarUrl') ? document.getElementById('cpAvatarUrl').value.trim() : '';
  const payload = {
    full_name: document.getElementById('cpFullName').value.trim(),
    specialization: document.getElementById('cpSpecialization').value.trim(),
    ai_tools_list: document.getElementById('cpTools').value.trim(),
    skills_list: document.getElementById('cpSkills').value.trim(),
    bio: document.getElementById('cpBio').value.trim(),
    day_rate: parseFloat(document.getElementById('cpDayRate').value) || 450,
    availability_status: document.getElementById('cpAvailability').value,
    commercial_capabilities: document.getElementById('cpCommercialCheck').checked ? 1 : 0
  };
  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
  }

  try {
    const res = await fetch('/api/creator/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Creator profile updated successfully!', 'success');
      await checkAuth(true);
    } else {
      showToast(data.message || 'Error updating profile', 'error');
    }
  } catch (err) {
    showToast('Failed to update profile', 'error');
  }
}

async function handleCreatorAvatarUpload(inputEl) {
  if (!inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    showToast(`Uploading ${file.name}...`, 'info');
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success && data.file_url) {
      await autoSaveCreatorAvatar(data.file_url);
    } else {
      showToast(data.error || 'Failed to upload photo', 'error');
    }
  } catch (err) {
    console.error("Error uploading creator avatar:", err);
    showToast('Network error uploading avatar photo', 'error');
  }
}

async function autoSaveCreatorAvatar(avatarUrl) {
  const avatarImg = document.getElementById('cpAvatarImg');
  if (avatarImg) avatarImg.src = avatarUrl;
  const avatarUrlInput = document.getElementById('cpAvatarUrl');
  if (avatarUrlInput) avatarUrlInput.value = avatarUrl;

  try {
    const res = await fetch('/api/creator/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });
    if (res.ok) {
      showToast('Profile photo updated and saved successfully!', 'success');
      const navAvatar = document.getElementById('navAvatar');
      if (navAvatar) navAvatar.src = avatarUrl;
      await checkAuth(true);
    } else {
      showToast('Photo uploaded but failed to save profile change', 'warning');
    }
  } catch (err) {
    console.error("Error persisting creator avatar:", err);
  }
}


// -------------------------------------------------------------
// 2. PORTFOLIO SHOWCASE
// -------------------------------------------------------------
async function loadCreatorPortfolioItems() {
  const grid = document.getElementById('creatorPortfolioGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/creator/portfolio');
    const items = await res.json();
    
    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-dim); grid-column:1/-1;">No showcases added yet. Click "+ Add New Showcase" to upload work.</p>';
      return;
    }

    grid.innerHTML = items.map(item => {
      const isVid = item.media_type === 'video' || (item.media_url || item.asset_url || '').endsWith('.mp4');
      const badgeText = isVid ? '🎬 4K MP4' : '🖼️ 8K JPG';
      const thumb = item.thumbnail_url || item.media_url || item.asset_url;
      return `
        <div class="portfolio-item-card">
          <div class="portfolio-thumb-wrap" onclick="openLightbox('${encodeURIComponent(JSON.stringify(item))}')" style="cursor:pointer;">
            <img src="${thumb}" class="portfolio-thumb" alt="${item.title}">
            <span class="badge ${isVid ? 'badge-primary' : 'badge-accent'}" style="position:absolute; top:8px; left:8px; font-size:0.65rem;">${badgeText}</span>
            <span class="badge badge-neutral" style="position:absolute; bottom:8px; right:8px; font-size:0.65rem;">${item.aspect_ratio || '16:9'}</span>
          </div>
          <div class="portfolio-body">
            <div style="font-size:0.95rem; font-weight:700;">${item.title}</div>
            <div style="font-size:0.75rem; color:var(--cyan); margin-top:2px;">Tools: ${item.tools_used || 'Diffusion'}</div>
            <p style="font-size:0.775rem; margin-top:4px; line-height:1.4;">${(item.workflow_summary || '').substring(0, 90)}...</p>
            <div style="margin-top:auto; padding-top:8px; display:flex; justify-content:space-between; align-items:center;">
              <span class="badge badge-neutral" style="font-size:0.65rem;">${item.media_type || 'image'}</span>
              <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:transparent;" onclick="deletePortfolioItem(${item.id})">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading portfolio:", err);
  }
}

function openAddPortfolioModal() {
  openModal('modalAddPortfolio');
}

async function submitNewPortfolio(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('portTitle').value.trim(),
    media_type: document.getElementById('portMediaType').value,
    aspect_ratio: document.getElementById('portAspect').value,
    asset_url: document.getElementById('portAssetUrl').value.trim(),
    thumbnail_url: document.getElementById('portAssetUrl').value.trim(),
    tools_used: document.getElementById('portTools').value.trim(),
    workflow_summary: document.getElementById('portWorkflow').value.trim(),
    commercial_rights_statement: document.getElementById('portRights').value.trim(),
    is_featured: 1
  };

  try {
    const res = await fetch('/api/creator/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      closeModal('modalAddPortfolio');
      showToast('Showcase added to portfolio!', 'success');
      loadCreatorPortfolioItems();
    } else {
      showToast(data.message || 'Error adding showcase', 'error');
    }
  } catch (err) {
    showToast('Failed to save portfolio showcase', 'error');
  }
}

async function deletePortfolioItem(id) {
  if (!confirm('Are you sure you want to remove this showcase?')) return;
  try {
    const res = await fetch(`/api/creator/portfolio/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Showcase removed', 'success');
      loadCreatorPortfolioItems();
    }
  } catch (err) {
    showToast('Error removing showcase', 'error');
  }
}

// -------------------------------------------------------------
// 3. WORKFLOW VERIFICATION
// -------------------------------------------------------------
async function loadCreatorVerificationRecords() {
  const container = document.getElementById('creatorVerifList');
  if (!container) return;

  try {
    const res = await fetch('/api/creator/verifications');
    const records = await res.json();

    if (!records || records.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim); padding:1rem 0;">No verification records submitted yet. Click "Submit Verification Evidence" to submit tool/workflow proof.</p>';
      return;
    }

    container.innerHTML = records.map(r => `
      <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 0.75rem; background: var(--bg-surface);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-size:0.95rem;">${r.title}</div>
            <div style="font-size:0.75rem; color:var(--cyan); margin-top:2px;">Category: ${r.evidence_type.toUpperCase()} • Submitted: ${r.submitted_at ? r.submitted_at.substring(0,10) : 'Recent'}</div>
          </div>
          <div>
            ${r.status === 'approved' ? '<span class="badge badge-success">✓ Approved</span>' : (r.status === 'rejected' ? '<span class="badge badge-danger">✕ Rejected</span>' : '<span class="badge badge-warning">⏳ Under Review</span>')}
            <span class="badge badge-neutral" style="margin-left:6px;">Confidence: ${r.confidence_score}%</span>
          </div>
        </div>
        <p style="font-size:0.825rem; color:var(--text-muted); margin-top:8px;">${r.description}</p>
        <div style="font-size:0.75rem; background:var(--bg-main); border:1px solid var(--border-subtle); padding:6px 10px; border-radius:4px; margin-top:8px; color:#CBD5E1;">
          <strong>Provenance URL:</strong> <a href="${r.evidence_url}" target="_blank" style="color:var(--primary); word-break:break-all;">${r.evidence_url}</a>
        </div>
        ${r.audit_notes ? `
          <div style="font-size:0.75rem; color:#93C5FD; margin-top:6px;">
            <strong>Inspector Notes:</strong> ${r.audit_notes}
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading verifications:", err);
  }
}

function openSubmitVerificationModal() {
  openModal('modalSubmitVerif');
}

async function submitVerificationRecord(e) {
  e.preventDefault();
  const evidenceUrl = document.getElementById('verifUrl').value.trim();
  if (!evidenceUrl) {
    showToast('Verification proof image is mandatory. Please upload an image or screenshot.', 'error');
    const fileInput = document.getElementById('verifFileInput');
    if (fileInput) fileInput.click();
    return;
  }

  const payload = {
    evidence_type: document.getElementById('verifType').value,
    title: document.getElementById('verifTitle').value.trim(),
    description: document.getElementById('verifDesc').value.trim(),
    evidence_url: evidenceUrl
  };

  try {
    const res = await fetch('/api/creator/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      closeModal('modalSubmitVerif');
      showToast(`Verification evidence submitted! AI Heuristic Score: ${data.heuristic_result.authenticity_score}%`, 'success');
      loadCreatorVerificationRecords();
      loadCreatorStats();
    } else {
      showToast(data.message || 'Error submitting evidence', 'error');
    }
  } catch (err) {
    showToast('Failed to submit verification evidence', 'error');
  }
}

// -------------------------------------------------------------
// 4. BRAND INVITATIONS
// -------------------------------------------------------------
async function loadCreatorInvitations() {
  const container = document.getElementById('creatorInvitesList');
  if (!container) return;

  try {
    const res = await fetch('/api/creator/invitations');
    const invites = await res.json();

    if (!invites || invites.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim); padding:1rem 0;">No pending invitations from brands at this time.</p>';
      return;
    }

    container.innerHTML = invites.map(inv => `
      <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1rem; background: var(--bg-surface);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-weight:700; font-size:1.05rem;">${inv.brief_title}</div>
            <div style="font-size:0.8rem; color:var(--text-dim);">From: <strong style="color:var(--text-main);">${inv.brand_name}</strong> • Budget: <strong style="color:var(--success);">$${inv.budget_max?.toLocaleString() || 'N/A'}</strong></div>
          </div>
          <div>
            ${inv.status === 'accepted' ? '<span class="badge badge-success">✓ Accepted & Workspace Active</span>' : (inv.status === 'declined' ? '<span class="badge badge-danger">Declined</span>' : '<span class="badge badge-warning">Awaiting Your Response</span>')}
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); background:var(--bg-main); padding:8px 12px; border-radius:4px; border:1px solid var(--border-subtle);">${inv.message}</p>
        
        ${inv.status === 'pending' ? `
          <div style="margin-top:12px; display:flex; gap:10px;">
            <button class="btn btn-primary btn-sm" onclick="respondInvitation(${inv.id}, 'accept')">Accept & Launch Workspace</button>
            <button class="btn btn-outline btn-sm" onclick="respondInvitation(${inv.id}, 'decline')">Decline</button>
          </div>
        ` : (inv.status === 'accepted' ? `
          <div style="margin-top:10px;">
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('workspace')">Open Workspace →</button>
          </div>
        ` : '')}
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading invitations:", err);
  }
}

async function respondInvitation(id, action) {
  try {
    const res = await fetch(`/api/creator/invitations/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, message: action === 'accept' ? 'Looking forward to delivering broadcast-grade generative media.' : 'Unavailable at this time.' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadCreatorInvitations();
      loadCreatorStats();
      if (action === 'accept') {
        setTimeout(() => navigateTo('workspace'), 1200);
      }
    } else {
      showToast(data.message || 'Error updating invitation', 'error');
    }
  } catch (err) {
    showToast('Failed to respond to invitation', 'error');
  }
}
