/**
 * CreatorVerse AI - Brand & Agency Module Controller
 * Manages Creative Briefs, AI-Assisted Brief Builder, Shortlists, and Invitations.
 */

let lastGeneratedBrief = null;

async function loadBrandData() {
  if (!currentUser || currentUser.role !== 'brand') return;
  await Promise.all([
    loadBrandStats(),
    loadBrandBriefs(),
    loadBrandInvitations(),
    loadBrandShortlist(),
    loadBrandProfileForm()
  ]);
}

function switchBrandTab(tabId) {
  document.querySelectorAll('.brand-tab-panel').forEach(p => p.style.display = 'none');
  const btns = ['Briefs', 'Invites', 'Shortlist', 'Profile'];
  btns.forEach(b => {
    const el = document.getElementById(`bSubTab${b}`);
    if (el) el.classList.remove('active');
  });

  if (tabId === 'briefs') {
    document.getElementById('bTabContentBriefs').style.display = 'block';
    document.getElementById('bSubTabBriefs').classList.add('active');
  } else if (tabId === 'invites') {
    document.getElementById('bTabContentInvites').style.display = 'block';
    document.getElementById('bSubTabInvites').classList.add('active');
    loadBrandInvitations();
  } else if (tabId === 'shortlist') {
    document.getElementById('bTabContentShortlist').style.display = 'block';
    document.getElementById('bSubTabShortlist').classList.add('active');
  } else if (tabId === 'profile') {
    document.getElementById('bTabContentProfile').style.display = 'block';
    document.getElementById('bSubTabProfile').classList.add('active');
  }
}

// -------------------------------------------------------------
// 1. STATS & PROFILE
// -------------------------------------------------------------
async function loadBrandStats() {
  try {
    const res = await fetch('/api/brand/dashboard-stats');
    if (!res.ok) return;
    const stats = await res.json();
    
    document.getElementById('bStatTotalBriefs').innerText = stats.total_briefs || 0;
    document.getElementById('bStatActiveProjects').innerText = stats.active_projects || 0;
    document.getElementById('bStatShortlist').innerText = stats.shortlisted_creators || 0;
    document.getElementById('bStatPendingInvites').innerText = stats.pending_invitations || 0;
  } catch (err) {
    console.error("Error loading brand stats:", err);
  }
}

async function loadBrandProfileForm() {
  try {
    const res = await fetch('/api/brand/profile');
    if (!res.ok) return;
    const p = await res.json();
    
    document.getElementById('bpCompanyName').value = p.company_name || '';
    document.getElementById('bpIndustry').value = p.industry || '';
    document.getElementById('bpContactEmail').value = p.contact_email || '';
    document.getElementById('bpWebsiteUrl').value = p.website_url || '';
    document.getElementById('bpBio').value = p.company_bio || '';

    const addrEl = document.getElementById('bpCompanyAddress');
    if (addrEl) addrEl.value = p.company_address || '';

    if (p.avatar_url) {
      const avatarImg = document.getElementById('bpAvatarImg');
      if (avatarImg) avatarImg.src = p.avatar_url;
      const avatarUrlInput = document.getElementById('bpAvatarUrl');
      if (avatarUrlInput) avatarUrlInput.value = p.avatar_url;
    }
    const nameLabel = document.getElementById('bpPhotoDisplayName');
    if (nameLabel && p.company_name) {
      nameLabel.innerText = `${p.company_name}'s Logo & Photo`;
    }
  } catch (err) {
    console.error("Error loading brand profile:", err);
  }
}

async function saveBrandProfile() {
  const avatarUrl = document.getElementById('bpAvatarUrl') ? document.getElementById('bpAvatarUrl').value.trim() : '';
  const payload = {
    company_name: document.getElementById('bpCompanyName').value.trim(),
    industry: document.getElementById('bpIndustry').value.trim(),
    contact_email: document.getElementById('bpContactEmail').value.trim(),
    website_url: document.getElementById('bpWebsiteUrl').value.trim(),
    company_bio: document.getElementById('bpBio').value.trim()
  };
  const addrEl = document.getElementById('bpCompanyAddress');
  if (addrEl) payload.company_address = addrEl.value.trim();

  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
  }

  try {
    const res = await fetch('/api/brand/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Brand profile updated successfully!', 'success');
      await checkAuth(true);
    } else {
      showToast(data.message || 'Error updating brand profile', 'error');
    }
  } catch (err) {
    showToast('Failed to update brand profile', 'error');
  }
}

async function handleBrandAvatarUpload(inputEl) {
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
      await autoSaveBrandAvatar(data.file_url);
    } else {
      showToast(data.error || 'Failed to upload photo', 'error');
    }
  } catch (err) {
    console.error("Error uploading brand avatar:", err);
    showToast('Network error uploading brand logo/photo', 'error');
  }
}

async function autoSaveBrandAvatar(avatarUrl) {
  const avatarImg = document.getElementById('bpAvatarImg');
  if (avatarImg) avatarImg.src = avatarUrl;
  const avatarUrlInput = document.getElementById('bpAvatarUrl');
  if (avatarUrlInput) avatarUrlInput.value = avatarUrl;

  try {
    const res = await fetch('/api/brand/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });
    if (res.ok) {
      showToast('Brand logo / photo updated and saved successfully!', 'success');
      const navAvatar = document.getElementById('navAvatar');
      if (navAvatar) navAvatar.src = avatarUrl;
      await checkAuth(true);
    } else {
      showToast('Photo uploaded but failed to save profile change', 'warning');
    }
  } catch (err) {
    console.error("Error persisting brand avatar:", err);
  }
}


// -------------------------------------------------------------
// 2. CREATIVE BRIEFS & AI BUILDER
// -------------------------------------------------------------
// -------------------------------------------------------------
// 2. CREATIVE BRIEFS & AI BUILDER
// -------------------------------------------------------------
function formatTimeline(tl) {
  if (!tl) return '10 Days';
  const str = String(tl).trim();
  if (str.toLowerCase().endsWith('days')) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return `${str} Days`;
}

async function loadBrandBriefs() {
  const container = document.getElementById('brandBriefsList');
  if (!container) return;

  try {
    const res = await fetch('/api/briefs');
    const briefs = await res.json();

    if (!Array.isArray(briefs) || briefs.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim); padding:1rem 0;">No creative briefs published yet. Click "⚡ AI-Assisted Brief Builder" or "➕ Create Manual Brief" to begin!</p>';
      return;
    }

    container.innerHTML = briefs.map(b => {
      const statusBadge = b.status === 'published' 
        ? '<span class="badge badge-success" style="font-size:0.7rem;">● Published</span>'
        : b.status === 'draft'
        ? '<span class="badge badge-warning" style="font-size:0.7rem;">● Draft</span>'
        : '<span class="badge badge-neutral" style="font-size:0.7rem;">● Closed</span>';

      const minB = b.budget_min ? `$${b.budget_min.toLocaleString()}` : '';
      const maxB = b.budget_max ? `$${b.budget_max.toLocaleString()}` : '$0';
      const budgetDisplay = minB ? `${minB} - ${maxB}` : maxB;

      return `
        <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1rem; background: var(--bg-surface); transition: border-color 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:700; font-size:1.1rem; color:var(--text-main);">${b.title}</span>
                ${statusBadge}
              </div>
              <div style="font-size:0.8rem; color:var(--cyan); margin-top:4px;">
                ${b.content_type || 'Cinematic AI Video'} • Style: ${b.style_genre || b.visual_style || 'Photorealistic 8K'} • Format: ${b.aspect_ratio || '16:9'}
              </div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <span class="badge badge-primary">${budgetDisplay}</span>
              <span class="badge badge-accent" style="margin-left:4px;">${formatTimeline(b.timeline_days || b.deadline)}</span>
            </div>
          </div>

          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:10px; line-height:1.45;">
            ${(b.description || b.objective || '').substring(0, 180)}...
          </p>

          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-dim); font-weight:600;">Target Toolchains:</span>
            ${(b.target_tools_list || b.required_tools || 'Runway, ComfyUI').split(',').map(t => `<span class="tag-pill">${t.trim()}</span>`).join('')}
          </div>

          <div style="margin-top:14px; display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="matchBriefInDiscovery(${b.id})">
              ⚡ Matched Profiles
            </button>
            <button class="btn btn-outline btn-sm" onclick="openEditBriefModal(${b.id})">
              ✏️ Edit Brief
            </button>
            <button class="btn btn-outline btn-sm" onclick="toggleBriefStatus(${b.id})">
              ${b.status === 'published' ? '🔒 Close Brief' : '🔓 Reopen Brief'}
            </button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.3);" onclick="deleteBrief(${b.id})">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading briefs:", err);
  }
}

async function loadBrandInvitations() {
  const container = document.getElementById('brandInvitationsContainer');

  try {
    const res = await fetch('/api/brand/invitations');
    if (!res.ok) return;
    const invites = await res.json();

    // Check for any accepted invitations to trigger celebratory popup modal & notification
    const accepted = invites.filter(i => i.status === 'accepted');
    const notifBtn = document.getElementById('brandNotificationBtn');
    const notifCount = document.getElementById('brandNotificationCount');

    if (accepted.length > 0) {
      lastAcceptedInvite = accepted[0];
      if (notifBtn) notifBtn.style.display = 'block';
      if (notifCount) notifCount.innerText = accepted.length;

      const seenKey = 'seen_accept_popup_' + lastAcceptedInvite.id;
      if (!sessionStorage.getItem(seenKey)) {
        sessionStorage.setItem(seenKey, 'true');
        showCreatorAcceptancePopup(lastAcceptedInvite);
      }
    } else {
      if (notifBtn) notifBtn.style.display = 'none';
    }

    if (!container) return;

    if (!invites || invites.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim); padding:1rem 0;">No sent invitations yet. Discover talent and click "Invite to Project" to collaborate!</p>';
      return;
    }

    container.innerHTML = invites.map(inv => {
      const isAccepted = inv.status === 'accepted';
      const isDeclined = inv.status === 'declined';
      const statusBadge = isAccepted 
        ? '<span class="badge badge-success" style="font-size:0.75rem;">✓ Accepted by Creator</span>' 
        : (isDeclined ? '<span class="badge badge-danger" style="font-size:0.75rem;">✕ Declined</span>' : '<span class="badge badge-warning" style="font-size:0.75rem;">⏳ Pending Response</span>');

      const actionButton = isAccepted
        ? `<div style="display:flex; gap:8px; flex-wrap:wrap;">
             <button class="btn btn-secondary btn-sm" onclick='showCreatorAcceptancePopup(${JSON.stringify(inv).replace(/'/g, "&#39;")})'>💬 View Acceptance</button>
             <button class="btn btn-primary btn-sm" onclick="navigateTo('workspace')">👉 Enter Workspace</button>
           </div>`
        : `<button class="btn btn-outline btn-sm" onclick="showToast('Waiting for creator response...', 'info')">⏳ Awaiting Response</button>`;

      return `
        <div style="border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1rem; background:var(--bg-surface);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:12px; align-items:center;">
              <img src="${inv.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid var(--border-subtle);">
              <div>
                <div style="font-weight:700; font-size:1.05rem;">${inv.creator_name}</div>
                <div style="font-size:0.8rem; color:var(--cyan);">${inv.creator_specialization || 'AI Creative Specialist'} • ★ ${inv.creator_rating || '5.0'}</div>
              </div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div style="margin: 10px 0; background:var(--bg-main); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.8rem; color:var(--text-dim);">Campaign Brief:</div>
            <strong style="color:var(--text-main); font-size:0.95rem;">${inv.brief_title}</strong>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
              Proposed Budget: <strong>$${(inv.proposed_budget || 5000).toLocaleString()}</strong> • Timeline: <strong>${inv.proposed_deadline || '14 days'}</strong>
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); margin-top:6px; font-style:italic;">
              "${inv.message}"
            </div>
          </div>

          ${inv.response_message ? `
            <div style="margin: 8px 0; background: rgba(52, 211, 153, 0.08); border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 4px; padding: 8px 12px;">
              <div style="font-size:0.75rem; color:#6EE7B7; font-weight:700;">💬 CREATOR ACCEPTANCE MESSAGE:</div>
              <div style="font-size:0.85rem; color:var(--text-main); margin-top:2px;">"${inv.response_message}"</div>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
            <span style="font-size:0.75rem; color:var(--text-dim);">
              ${isAccepted ? '✅ Acceptance message received! Collaboration active.' : 'Sent: ' + (inv.created_at || 'Recently')}
            </span>
            ${actionButton}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading brand invitations:", err);
  }
}

function showCreatorAcceptancePopup(inv) {
  if (!inv) return;
  const briefEl = document.getElementById('popupAcceptBriefTitle');
  if (briefEl) briefEl.innerHTML = `Invitation accepted for campaign <strong>"${inv.brief_title || 'Commercial Campaign'}"</strong>. Production Workspace is initialized!`;
  
  const avatarEl = document.getElementById('popupAcceptAvatar');
  if (avatarEl) avatarEl.src = inv.creator_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';

  const nameEl = document.getElementById('popupAcceptCreatorName');
  if (nameEl) nameEl.innerText = inv.creator_name || 'AI Creator';

  const specEl = document.getElementById('popupAcceptCreatorSpec');
  if (specEl) specEl.innerText = inv.creator_specialization || 'AI Creative Specialist';

  const msgEl = document.getElementById('popupAcceptMessage');
  if (msgEl) msgEl.innerText = inv.response_message ? `"${inv.response_message}"` : '"Accepted commission invitation. Looking forward to delivering broadcast-grade generative media."';

  openModal('modalCreatorAcceptancePopup');
}

function checkBrandNotifications() {
  if (lastAcceptedInvite) {
    showCreatorAcceptancePopup(lastAcceptedInvite);
  } else {
    navigateTo('brand-dashboard');
    switchBrandTab('invites');
  }
}


function openAIBriefBuilderModal() {
  document.getElementById('briefEditId').value = '';
  document.getElementById('aiRoughIdeaInput').value = '';
  document.getElementById('aiBriefModalTitle').innerText = 'AI-Assisted Brief Builder';
  document.getElementById('aiBriefModalBadge').innerText = 'NLP Automation Engine';
  document.getElementById('aiBriefNlpSection').style.display = 'block';
  document.getElementById('aiBriefResultContainer').style.display = 'none';
  openModal('modalAIBriefBuilder');
}

function openCreateManualBrief() {
  document.getElementById('briefEditId').value = '';
  document.getElementById('aiBriefModalTitle').innerText = 'Create Creative Brief';
  document.getElementById('aiBriefModalBadge').innerText = 'Manual Specification';
  document.getElementById('aiBriefNlpSection').style.display = 'none';
  
  // Set defaults
  document.getElementById('briefFormTitle').value = '';
  document.getElementById('briefFormObjective').value = '';
  document.getElementById('briefFormContentType').value = 'Cinematic AI Video';
  document.getElementById('briefFormStyle').value = 'Photorealistic 8K';
  document.getElementById('briefFormAspect').value = '16:9 Landscape';
  document.getElementById('briefFormResolution').value = '4K UHD (3840x2160)';
  document.getElementById('briefFormAudience').value = 'Global digital audience';
  document.getElementById('briefFormPlatforms').value = 'Broadcast TV, YouTube, Instagram Reels';
  document.getElementById('briefFormBudgetMin').value = '2500';
  document.getElementById('briefFormBudgetMax').value = '5000';
  document.getElementById('briefFormDeadline').value = '10 days';
  document.getElementById('briefFormTools').value = 'Runway Gen-3, Midjourney v6, ComfyUI, Topaz Video AI';
  document.getElementById('briefFormSkills').value = 'Cinematography, Prompt Engineering, Color Grading';
  document.getElementById('briefFormRights').value = 'Full Commercial Buyout (Perpetual Broadcast, Digital & DOOH), Global Rights.';
  document.getElementById('briefFormDeliverables').value = '1x 30s Master 4K Video Cut (16:9)\n3x 10s Social Vertical Cutdowns (9:16)\nSource Prompt Graph & Seed Manifest';
  
  document.getElementById('aiGenConfidence').innerText = 'Manual Authoring';
  document.getElementById('aiGenStatusTag').innerText = 'Brand Specification';
  document.getElementById('aiMissingInfoBox').style.display = 'none';
  document.getElementById('aiBriefResultContainer').style.display = 'block';
  
  openModal('modalAIBriefBuilder');
}

async function openEditBriefModal(briefId) {
  try {
    const res = await fetch(`/api/briefs/${briefId}`);
    if (!res.ok) {
      showToast('Failed to load brief details', 'error');
      return;
    }
    const b = await res.json();

    document.getElementById('briefEditId').value = b.id;
    document.getElementById('aiBriefModalTitle').innerText = 'Edit Creative Brief';
    document.getElementById('aiBriefModalBadge').innerText = 'Brief Modification';
    document.getElementById('aiBriefNlpSection').style.display = 'none';

    document.getElementById('briefFormTitle').value = b.title || '';
    document.getElementById('briefFormObjective').value = b.objective || b.description || '';
    document.getElementById('briefFormContentType').value = b.content_type || 'Cinematic AI Video';
    document.getElementById('briefFormStyle').value = b.visual_style || b.style_genre || 'Photorealistic 8K';
    document.getElementById('briefFormAspect').value = b.aspect_ratio || '16:9 Landscape';
    document.getElementById('briefFormResolution').value = b.resolution || '4K UHD (3840x2160)';
    document.getElementById('briefFormAudience').value = b.target_audience || '';
    document.getElementById('briefFormPlatforms').value = b.target_platforms || '';
    document.getElementById('briefFormBudgetMin').value = b.budget_min || 2000;
    document.getElementById('briefFormBudgetMax').value = b.budget_max || 5000;
    document.getElementById('briefFormDeadline').value = b.deadline || b.timeline_days || '10 days';
    document.getElementById('briefFormTools').value = b.required_tools || b.target_tools_list || '';
    document.getElementById('briefFormSkills').value = b.required_skills || b.required_skills_list || '';
    document.getElementById('briefFormRights').value = b.commercial_usage_type || 'Full Commercial Buyout';
    document.getElementById('briefFormDeliverables').value = b.deliverables || '';

    document.getElementById('aiGenConfidence').innerText = 'Editing Active Brief';
    document.getElementById('aiGenStatusTag').innerText = b.status.toUpperCase();
    document.getElementById('aiMissingInfoBox').style.display = 'none';
    document.getElementById('aiBriefResultContainer').style.display = 'block';

    openModal('modalAIBriefBuilder');
  } catch (err) {
    showToast('Error opening brief editor', 'error');
  }
}

function fillAiSampleIdea(type) {
  const input = document.getElementById('aiRoughIdeaInput');
  if (type === 'beverage') {
    input.value = "30-second hyper-energy cyberpunk soda commercial for 'Volt Zero'. Fast tracking shots through rain-slicked Tokyo streets, glowing electric cyan #00FFCC and neon magenta reflections, condensation closeups on the titanium can, 4K 60fps.";
  } else if (type === 'fashion') {
    input.value = "Haute couture virtual runway film and lookbook for 'Nebula' Fall/Winter collection. Synthetic avatar models walking in minimalist concrete brutalist architecture, luminescent optic fiber gowns, 8K ultra-detail editorial photography.";
  } else if (type === 'tech') {
    input.value = "45-second cinematic teaser for next-gen spatial computing visor. Dark titanium finish, floating volumetric holographic UI interfaces, studio lighting, ambient electronic sound design, 4K broadcast master.";
  }
}

function toggleNlpRoughInput() {
  const nlpSec = document.getElementById('aiBriefNlpSection');
  nlpSec.style.display = nlpSec.style.display === 'none' ? 'block' : 'none';
}

async function generateAIBrief() {
  const rough_idea = document.getElementById('aiRoughIdeaInput').value.trim();
  if (!rough_idea) {
    showToast('Please type a campaign concept or select a preset chip.', 'error');
    return;
  }

  const btn = document.getElementById('btnGenerateBrief');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⚡ Analyzing Concept & Synthesizing Parameters...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/briefs/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rough_idea })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || data.message || 'Generation failed', 'error');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    lastGeneratedBrief = data.brief;
    const b = data.brief;

    // Populate all interactive form fields
    document.getElementById('briefFormTitle').value = b.title || '';
    document.getElementById('briefFormObjective').value = b.description || '';
    if (b.content_type) document.getElementById('briefFormContentType').value = b.content_type;
    document.getElementById('briefFormStyle').value = b.style_genre || 'Photorealistic 8K';
    if (b.aspect_ratio) document.getElementById('briefFormAspect').value = b.aspect_ratio;
    if (b.resolution) document.getElementById('briefFormResolution').value = b.resolution;
    document.getElementById('briefFormAudience').value = 'Gen-Z & Millennial Digital Consumers';
    document.getElementById('briefFormPlatforms').value = 'Broadcast TV, YouTube 4K, Instagram Reels, TikTok, DOOH';
    document.getElementById('briefFormBudgetMin').value = Math.max(1000, Math.round((b.budget || 4000) * 0.7));
    document.getElementById('briefFormBudgetMax').value = Math.round(b.budget || 5000);
    document.getElementById('briefFormDeadline').value = `${b.timeline_days || 10} days`;
    document.getElementById('briefFormTools').value = b.target_tools || 'Runway Gen-3, Midjourney v6, ComfyUI';
    document.getElementById('briefFormSkills').value = b.required_skills || 'Cinematography, Color Grading, Prompt Engineering';
    document.getElementById('briefFormRights').value = 'Full Commercial Buyout (Perpetual Broadcast, Digital & DOOH), Global Rights.';
    document.getElementById('briefFormDeliverables').value = (b.deliverables || []).join('\n');

    // Badges & feedback
    document.getElementById('aiGenConfidence').innerText = `${b.confidence_score || 95}% AI Confidence`;
    document.getElementById('aiGenStatusTag').innerText = 'Synthesized & Ready';

    // Missing info warnings
    const missingBox = document.getElementById('aiMissingInfoBox');
    const missingUl = document.getElementById('aiGenMissingList');
    if (b.missing_information && b.missing_information.length > 0) {
      missingBox.style.display = 'block';
      missingUl.innerHTML = b.missing_information.map(m => `<li>${m}</li>`).join('');
    } else {
      missingBox.style.display = 'none';
    }

    document.getElementById('aiBriefResultContainer').style.display = 'block';
    showToast('Structured creative brief synthesized! You can refine any parameter before publishing.', 'success');
  } catch (err) {
    showToast('AI Brief Builder generation failed', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function submitBriefForm(status = 'published') {
  const briefId = document.getElementById('briefEditId').value.trim();
  const title = document.getElementById('briefFormTitle').value.trim();
  if (!title) {
    showToast('Please provide a campaign title.', 'error');
    document.getElementById('briefFormTitle').focus();
    return;
  }

  const payload = {
    title: title,
    objective: document.getElementById('briefFormObjective').value.trim(),
    description: document.getElementById('briefFormObjective').value.trim(),
    content_type: document.getElementById('briefFormContentType').value,
    visual_style: document.getElementById('briefFormStyle').value.trim(),
    style_genre: document.getElementById('briefFormStyle').value.trim(),
    aspect_ratio: document.getElementById('briefFormAspect').value,
    resolution: document.getElementById('briefFormResolution').value,
    target_audience: document.getElementById('briefFormAudience').value.trim(),
    target_platforms: document.getElementById('briefFormPlatforms').value.trim(),
    budget_min: parseFloat(document.getElementById('briefFormBudgetMin').value) || 2000,
    budget_max: parseFloat(document.getElementById('briefFormBudgetMax').value) || 5000,
    budget: parseFloat(document.getElementById('briefFormBudgetMax').value) || 5000,
    deadline: document.getElementById('briefFormDeadline').value.trim() || '10 days',
    timeline_days: document.getElementById('briefFormDeadline').value.trim() || '10 days',
    required_tools: document.getElementById('briefFormTools').value.trim(),
    target_tools_list: document.getElementById('briefFormTools').value.trim(),
    required_skills: document.getElementById('briefFormSkills').value.trim(),
    required_skills_list: document.getElementById('briefFormSkills').value.trim(),
    commercial_usage_type: document.getElementById('briefFormRights').value.trim(),
    commercial_use_requirements: document.getElementById('briefFormRights').value.trim(),
    deliverables: document.getElementById('briefFormDeliverables').value.trim(),
    status: status
  };

  try {
    const isEdit = !!briefId;
    const url = isEdit ? `/api/briefs/${briefId}` : '/api/briefs';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      closeModal('modalAIBriefBuilder');
      showToast(isEdit ? 'Creative brief updated successfully!' : `Creative brief ${status === 'draft' ? 'saved as draft' : 'published'}!`, 'success');
      await loadBrandBriefs();
      await loadBrandStats();

      // If published, trigger discovery match after short delay
      if (status === 'published') {
        const targetId = isEdit ? briefId : data.id;
        setTimeout(() => {
          matchBriefInDiscovery(targetId);
        }, 500);
      }
    } else {
      showToast(data.error || data.message || 'Failed to save brief. Please sign in to Brand Hub.', 'error');
    }
  } catch (err) {
    showToast('Failed to save creative brief', 'error');
  }
}

async function toggleBriefStatus(briefId) {
  try {
    const res = await fetch(`/api/briefs/${briefId}/toggle-status`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || `Brief is now ${data.new_status}`, 'success');
      loadBrandBriefs();
      loadBrandStats();
    } else {
      showToast(data.error || 'Failed to toggle status', 'error');
    }
  } catch (err) {
    showToast('Error updating brief status', 'error');
  }
}

async function deleteBrief(briefId) {
  if (!confirm('Are you sure you want to delete this creative brief?')) return;
  try {
    const res = await fetch(`/api/briefs/${briefId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Creative brief deleted successfully', 'success');
      loadBrandBriefs();
      loadBrandStats();
    } else {
      showToast(data.error || 'Failed to delete brief', 'error');
    }
  } catch (err) {
    showToast('Error deleting creative brief', 'error');
  }
}

function matchBriefInDiscovery(briefId) {
  navigateTo('discovery');
  setTimeout(() => {
    const sel = document.getElementById('discMatchBriefSelect');
    if (sel) {
      sel.value = briefId;
      triggerDiscoveryFilter();
    }
  }, 300);
}

// -------------------------------------------------------------
// 3. SHORTLIST & INVITATIONS
// -------------------------------------------------------------
async function loadBrandShortlist() {
  const container = document.getElementById('brandShortlistContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/brand/shortlist');
    const items = await res.json();

    if (!items || items.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim); padding:1rem 0;">No creators saved in your shortlist yet. Explore creators and click "+ Shortlist".</p>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1rem; margin-bottom:0.75rem; background:var(--bg-surface);">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-weight:700;">${item.creator_name} ${item.is_verified ? '<span style="color:var(--success);">✓</span>' : ''}</div>
            <div style="font-size:0.8rem; color:var(--cyan);">${item.specialization} • $${item.day_rate}/day</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="openInviteModal(${item.creator_id}, '${item.creator_name}')">Send Commission Invite</button>
          <button class="btn btn-outline btn-sm" onclick="removeFromShortlist(${item.creator_id})">Remove</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading shortlist:", err);
  }
}

async function removeFromShortlist(creatorId) {
  try {
    const res = await fetch('/api/brand/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id: creatorId, action: 'remove' })
    });
    if (res.ok) {
      showToast('Removed from shortlist', 'success');
      loadBrandShortlist();
      loadBrandStats();
    }
  } catch (err) {
    showToast('Error removing from shortlist', 'error');
  }
}
