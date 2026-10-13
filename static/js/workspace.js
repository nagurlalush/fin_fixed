/**
 * CreatorVerse AI - Workspace, Deliverables & Revisions Controller
 * Manages versioned asset deliveries (v1.0, v1.1), timecode markers, milestones, and chat.
 */

let activeProjectId = null;
let cachedWorkspaceDeliverables = [];

async function loadWorkspaceData() {
  if (!currentUser) return;
  await loadUserProjectsList();
}

async function loadUserProjectsList() {
  const switchSelect = document.getElementById('wsSwitchSelect');
  if (!switchSelect) return;

  try {
    const res = await fetch('/api/projects');
    const projects = await res.json();

    if (!projects || projects.length === 0) {
      const pTitle = document.getElementById('wsProjectTitle');
      if (pTitle) pTitle.innerText = 'No Active Workspaces';
      const pInfo = document.getElementById('wsPartnerInfo');
      if (pInfo) pInfo.innerText = 'Accept an invitation or commission a creator to launch a production workspace.';
      const msList = document.getElementById('wsMilestonesList');
      if (msList) msList.innerHTML = '<p style="color:var(--text-dim)">No milestones currently scheduled.</p>';
      const delivList = document.getElementById('wsDeliverablesList');
      if (delivList) delivList.innerHTML = '<p style="color:var(--text-dim)">No deliverables submitted yet.</p>';
      const comList = document.getElementById('wsCommentsList');
      if (comList) comList.innerHTML = '';
      return;
    }

    switchSelect.innerHTML = projects.map(p => `
      <option value="${p.id}">${p.title} (${p.status})</option>
    `).join('');

    const targetId = activeProjectId || projects[0].id;
    switchSelect.value = targetId;
    await loadSpecificWorkspace(targetId);
  } catch (err) {
    console.error("Error loading projects list:", err);
  }
}

async function loadSpecificWorkspace(projectId) {
  activeProjectId = projectId;
  try {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      showToast('Workspace not found or unauthorized access', 'error');
      return;
    }
    const p = await res.json();

    document.getElementById('wsProjectTitle').innerText = p.title;
    document.getElementById('wsPartnerInfo').innerText = `Collaboration between ${p.brand_name || 'Brand'} and ${p.creator_name || 'Creator'}`;

    // Toggle role-appropriate controls in Workspace Header
    const submitBtn = document.getElementById('wsSubmitDeliverableBtn');
    const brandBadge = document.getElementById('wsBrandReviewBadge');
    if (submitBtn && brandBadge) {
      if (currentUser && currentUser.role === 'brand') {
        submitBtn.style.display = 'none';
        brandBadge.style.display = 'inline-flex';
      } else {
        submitBtn.style.display = 'inline-flex';
        brandBadge.style.display = 'none';
      }
    }

    // Render Milestones
    renderMilestones(p.milestones || []);

    // Render Deliverables
    cachedWorkspaceDeliverables = p.deliverables || [];
    renderDeliverables(cachedWorkspaceDeliverables);

    // Render IP Terms
    renderCommercialTerms(p.commercial_terms);

    // Render Comments
    renderComments(p.comments || []);
  } catch (err) {
    console.error("Error loading workspace:", err);
  }
}

function renderMilestones(milestones) {
  const container = document.getElementById('wsMilestonesList');
  if (!container) return;

  if (milestones.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim)">No milestones configured.</p>';
    return;
  }

  container.innerHTML = milestones.map(m => `
    <div style="flex:1; min-width:200px; background:var(--bg-main); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; font-size:0.85rem;">${m.title}</span>
        ${m.status === 'completed' ? '<span class="badge badge-success">✓ Done</span>' : (m.status === 'in_progress' ? '<span class="badge badge-primary">Active</span>' : '<span class="badge badge-neutral">Pending</span>')}
      </div>
      <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${m.description}</p>
    </div>
  `).join('');
}

function renderDeliverables(deliverables) {
  const container = document.getElementById('wsDeliverablesList');
  if (!container) return;

  const isBrand = currentUser && currentUser.role === 'brand';

  if (deliverables.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1.5rem; color: var(--text-dim); background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-main);">
          ${isBrand ? '🛡️ Client Review Portal - Awaiting Deliverables' : '📁 No Deliverables Submitted Yet'}
        </p>
        <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto; color: var(--text-muted); line-height: 1.5;">
          ${isBrand ? 'The commissioned AI Creator is currently producing assets for this milestone. Once uploaded, you will be able to review versioned cuts, leave timecode revision markers, and issue commercial master approval here.' : 'Upload your first render, preview cut, or master delivery package to request client review and feedback.'}
        </p>
        ${!isBrand ? '<button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="openUploadDeliverableModal()">+ Submit First Deliverable</button>' : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = deliverables.map(d => `
    <div class="deliverable-card">
      <div class="deliverable-header">
        <div>
          <span class="version-pill">${d.version}</span>
          <strong style="margin-left:8px; font-size:0.95rem;">${d.title}</strong>
        </div>
        <div>
          ${d.review_status === 'approved' ? '<span class="badge badge-success">✓ Approved Master</span>' : (d.review_status === 'revision_requested' ? '<span class="badge badge-warning">⚠️ Revision Requested</span>' : '<span class="badge badge-cyan">⏳ In Review</span>')}
        </div>
      </div>

      <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:8px;">
        Uploaded by <strong style="color:var(--text-main);">${d.uploaded_by_name}</strong> on ${d.created_at ? d.created_at.substring(0, 16) : 'Recent'}
      </div>

      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">${d.notes || 'Master asset package handoff.'}</p>

      <div style="background:var(--bg-main); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.775rem; font-family:var(--font-mono); color:#93C5FD; word-break:break-all;">
          ${d.file_url}
        </span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="openDeliverableInspector(${d.id})" style="flex-shrink:0;">
            ⚡ Inspect Asset & Preview
          </button>
        </div>
      </div>

      <!-- Timecoded Markers & Feedback notes -->
      ${d.revision_notes ? `
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:var(--radius-sm); padding:10px; margin-top:8px;">
          <div style="font-size:0.8rem; font-weight:700; color:#FCD34D; margin-bottom:4px;">Brand Feedback & Timecode Markers:</div>
          ${d.timecode_markers ? `
            <div style="margin-bottom:6px; display:flex; flex-wrap:wrap; gap:6px;">
              ${d.timecode_markers.split(';').map(tc => `<span class="timecode-tag" style="cursor:pointer;" onclick="openDeliverableInspector(${d.id})">${tc.trim()}</span>`).join('')}
            </div>
          ` : ''}
          <div style="font-size:0.8rem; color:#FEF3C7;">${d.revision_notes}</div>
        </div>
      ` : ''}

      <!-- Review Action for Brand / Admin -->
      ${(currentUser && (currentUser.role === 'brand' || currentUser.role === 'admin')) ? `
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="openReviewDeliverableModal(${d.id})">Review & Mark Decision</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderCommercialTerms(terms) {
  const container = document.getElementById('wsCommercialTerms');
  if (!container) return;

  if (!terms) {
    container.innerHTML = '<p>Standard commercial buyout agreement active.</p>';
    return;
  }

  container.innerHTML = `
    <div><strong>License Tier:</strong> ${terms.license_type}</div>
    <div><strong>Exclusivity:</strong> ${terms.exclusivity}</div>
    <div><strong>Training Rights:</strong> ${terms.model_training_rights}</div>
    <div><strong>Source Graph Included:</strong> ${terms.source_files_included ? 'Yes (Nodal Graph & Checkpoint Seeds)' : 'No'}</div>
    <div style="margin-top:6px; color:var(--text-dim); font-size:0.75rem;">Signed indemnification active for commercial distribution.</div>
  `;
}

function renderComments(comments) {
  const container = document.getElementById('wsCommentsList');
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim); font-size:0.8rem;">No messages in workspace channel yet.</p>';
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="comment-bubble">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-weight:700; font-size:0.825rem; color:${c.sender_role === 'creator' ? 'var(--cyan)' : 'var(--primary)'};">${c.sender_name}</span>
        <span style="font-size:0.7rem; color:var(--text-dim);">${c.created_at ? c.created_at.substring(11, 16) : ''}</span>
      </div>
      <p style="font-size:0.825rem; color:var(--text-muted); margin:0;">${c.message}</p>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

// -------------------------------------------------------------
// DELIVERABLE UPLOAD & REVIEW MODALS
// -------------------------------------------------------------
function openUploadDeliverableModal() {
  if (currentUser && currentUser.role === 'brand') {
    showToast('Brand accounts review deliverables. Deliverables are submitted by commissioned AI Creators.', 'info');
    return;
  }
  if (!activeProjectId) {
    showToast('No active workspace selected', 'error');
    return;
  }
  openModal('modalUploadDeliverable');
}

async function submitDeliverableItem(e) {
  e.preventDefault();
  if (!activeProjectId) return;

  const fileUrl = document.getElementById('delivUrl').value.trim();
  if (!fileUrl) {
    showToast('Deliverable master file / image is mandatory. Please upload your asset.', 'error');
    const fileInput = document.getElementById('delivFileInput');
    if (fileInput) fileInput.click();
    return;
  }

  const payload = {
    title: document.getElementById('delivTitle').value.trim(),
    version: document.getElementById('delivVersion').value,
    file_type: document.getElementById('delivType').value,
    file_url: fileUrl,
    notes: document.getElementById('delivNotes').value.trim()
  };

  try {
    const res = await fetch(`/api/projects/${activeProjectId}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      closeModal('modalUploadDeliverable');
      showToast(data.message, 'success');
      loadSpecificWorkspace(activeProjectId);
    } else {
      showToast(data.message || 'Error uploading deliverable', 'error');
    }
  } catch (err) {
    showToast('Failed to upload deliverable', 'error');
  }
}

function openReviewDeliverableModal(deliverableId) {
  document.getElementById('revDeliverableId').value = deliverableId;
  document.getElementById('revDecision').value = 'approved';
  toggleRevisionNotes('approved');
  openModal('modalReviewDeliverable');
}

function toggleRevisionNotes(decision) {
  const timecodeWrap = document.getElementById('revTimecodeWrap');
  if (decision === 'revision_requested') {
    timecodeWrap.style.display = 'block';
  } else {
    timecodeWrap.style.display = 'none';
  }
}

async function submitDeliverableReview(e) {
  e.preventDefault();
  const id = document.getElementById('revDeliverableId').value;
  const decision = document.getElementById('revDecision').value;
  const revision_notes = document.getElementById('revNotes').value.trim();
  const timecode_markers = document.getElementById('revTimecodes').value.trim();

  try {
    const res = await fetch(`/api/deliverables/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, revision_notes, timecode_markers })
    });
    const data = await res.json();
    if (res.ok) {
      closeModal('modalReviewDeliverable');
      showToast(data.message, 'success');
      loadSpecificWorkspace(activeProjectId);
    } else {
      showToast(data.message || 'Error reviewing deliverable', 'error');
    }
  } catch (err) {
    showToast('Failed to submit review', 'error');
  }
}

async function postWorkspaceComment(e) {
  e.preventDefault();
  if (!activeProjectId) return;

  const input = document.getElementById('wsCommentInput');
  const message = input.value.trim();
  if (!message) return;

  try {
    const res = await fetch(`/api/projects/${activeProjectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (res.ok) {
      input.value = '';
      loadSpecificWorkspace(activeProjectId);
    }
  } catch (err) {
    showToast('Error sending message', 'error');
  }
}


// -------------------------------------------------------------
// INTERACTIVE ASSET INSPECTOR MODAL & TIMECODES CONTROLLER
// -------------------------------------------------------------
let currentInspectedDeliverableId = null;

function openDeliverableInspector(deliverableId) {
  const d = cachedWorkspaceDeliverables.find(item => item.id == deliverableId);
  if (!d) {
    showToast('Deliverable record not found', 'error');
    return;
  }

  currentInspectedDeliverableId = deliverableId;

  document.getElementById('inspVersion').innerText = d.version || 'v1.0';
  document.getElementById('inspTitle').innerText = d.title;
  
  const statusBadge = document.getElementById('inspStatusBadge');
  if (d.review_status === 'approved') {
    statusBadge.className = 'badge badge-success';
    statusBadge.innerText = '✓ Approved Master';
  } else if (d.review_status === 'revision_requested') {
    statusBadge.className = 'badge badge-warning';
    statusBadge.innerText = '⚠️ Revision Requested';
  } else {
    statusBadge.className = 'badge badge-cyan';
    statusBadge.innerText = '⏳ In Review';
  }

  document.getElementById('inspResolution').innerText = d.resolution || '4K UHD (3840x2160)';
  document.getElementById('inspAspect').innerText = d.aspect_ratio || '16:9 Landscape';
  document.getElementById('inspFileSize').innerText = d.file_size || '85 MB';
  document.getElementById('inspFileUrl').innerText = d.file_url;

  // Video element setup
  const videoEl = document.getElementById('inspVideo');
  const videoSrc = document.getElementById('inspVideoSrc');
  
  // Set reliable video source
  const safeVideoUrl = d.file_url && !d.file_url.includes('commondatastorage.googleapis.com') ? d.file_url : '/static/uploads/volt_zero_v1_0.mp4';
  videoSrc.src = safeVideoUrl;
  videoEl.load();
  videoEl.play().catch(e => console.log('Autoplay deferred:', e));

  // Timecodes pill container
  const tcWrap = document.getElementById('inspTimecodesWrap');
  const tcList = document.getElementById('inspTimecodesList');
  const revNotes = document.getElementById('inspRevisionNotes');

  if (d.revision_timecodes || d.timecode_markers) {
    tcWrap.style.display = 'block';
    const rawTc = d.revision_timecodes || d.timecode_markers || '';
    const parts = rawTc.split(';');

    tcList.innerHTML = parts.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // Extract minute:second
      const match = trimmed.match(/(\d+):(\d+)/);
      let sec = 0;
      if (match) {
        sec = parseInt(match[1]) * 60 + parseInt(match[2]);
      }
      return `
        <button type="button" class="timecode-pill-btn" onclick="seekInspectorVideo(${sec}, '${trimmed.replace(/'/g, "\\'")}')">
          ⏱ Jump to ${trimmed}
        </button>
      `;
    }).join('');

    revNotes.innerText = d.revision_notes || '';
  } else {
    tcWrap.style.display = 'none';
    tcList.innerHTML = '';
    revNotes.innerText = '';
  }

  // Setup download button
  document.getElementById('inspDownloadBtn').href = safeVideoUrl;

  // Review buttons visibility (Brand / Admin)
  const reviewControls = document.getElementById('inspReviewControls');
  if (currentUser && (currentUser.role === 'brand' || currentUser.role === 'admin')) {
    reviewControls.style.display = 'flex';
  } else {
    reviewControls.style.display = 'none';
  }

  openModal('modalDeliverableInspector');
}

function closeDeliverableInspector() {
  const videoEl = document.getElementById('inspVideo');
  if (videoEl) videoEl.pause();
  closeModal('modalDeliverableInspector');
}

function seekInspectorVideo(seconds, markerText) {
  const videoEl = document.getElementById('inspVideo');
  if (!videoEl) return;
  videoEl.currentTime = seconds;
  videoEl.play().catch(e => console.log(e));
  showToast(`Jumped to ${seconds}s: ${markerText}`, 'info');
}

function triggerInspectorReview(decision) {
  closeDeliverableInspector();
  if (decision === 'approved') {
    submitDeliverableReviewDirect(currentInspectedDeliverableId, 'approved', 'Master broadcast render approved without reservations.');
  } else {
    openReviewDeliverableModal(currentInspectedDeliverableId);
  }
}

async function submitDeliverableReviewDirect(deliverableId, decision, notes) {
  try {
    const res = await fetch(`/api/deliverables/${deliverableId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, revision_notes: notes, timecode_markers: '' })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadSpecificWorkspace(activeProjectId);
    } else {
      showToast(data.message || 'Error updating deliverable', 'error');
    }
  } catch (err) {
    showToast('Failed to submit review', 'error');
  }
}
