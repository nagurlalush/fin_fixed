/**
 * CreatorVerse AI - Creator Discovery & Matched Profiles Engine
 * Handles talent exploration, synergy filters, match explanation cards, and invitations.
 */

let cachedBriefs = [];

async function loadDiscoveryData() {
  await loadDiscoveryBriefsSelector();
  await triggerDiscoveryFilter();
}

async function loadDiscoveryBriefsSelector() {
  const sel = document.getElementById('discMatchBriefSelect');
  if (!sel) return;

  try {
    const res = await fetch('/api/briefs');
    cachedBriefs = await res.json();
    
    sel.innerHTML = '<option value="">✨ Matched Profiles (Brand Synergy View)</option>' +
      cachedBriefs.map(b => `<option value="${b.id}">Brief: ${b.title} ($${b.budget_max?.toLocaleString()})</option>`).join('');
  } catch (err) {
    console.error("Error loading briefs selector:", err);
  }
}

async function triggerDiscoveryFilter() {
  const grid = document.getElementById('discoveryCreatorsGrid');
  const countEl = document.getElementById('discoveryResultsCount');
  if (!grid) return;

  const isCreator = currentUser && currentUser.role === 'creator';

  // Role visibility: Hide 'AI Match Against Brief' option in Creator's login only
  const matchBox = document.getElementById('discMatchBriefGroup');
  if (matchBox) {
    matchBox.style.display = isCreator ? 'none' : 'block';
  }

  const briefSelect = document.getElementById('discMatchBriefSelect');
  const briefId = (!isCreator && briefSelect) ? briefSelect.value : '';
  const q = document.getElementById('discSearchInput').value.trim();
  const spec = document.getElementById('discSpecSelect').value;
  const tool = document.getElementById('discToolSelect').value;
  const maxRate = document.getElementById('discMaxRateInput').value.trim();
  const verifiedOnly = document.getElementById('discVerifiedOnly').checked;

  const params = new URLSearchParams();
  if (briefId) params.append('brief_id', briefId);
  if (q) params.append('q', q);
  if (spec) params.append('specialization', spec);
  if (tool) params.append('tool', tool);
  if (maxRate) params.append('max_rate', maxRate);
  if (verifiedOnly) params.append('verified', 'true');

  try {
    grid.innerHTML = '<div style="color:var(--text-dim); padding:2rem 0;">Analyzing creators & calculating matched profile compatibility...</div>';
    const res = await fetch(`/api/creators?${params.toString()}`);
    const creators = await res.json();

    if (!creators || creators.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-dim); padding:2rem 0; grid-column:1/-1;">No creators found matching these filters. Try adjusting search criteria.</div>';
      countEl.innerText = '0 creators found';
      return;
    }

    countEl.innerText = `Showing ${creators.length} creators ${briefId ? '(Ranked by Brief Compatibility)' : (!isCreator ? '(Ranked by Matched Profiles)' : '')}`;

    grid.innerHTML = creators.map(c => {
      // Clean tags string without brackets/quotes
      const cleanTools = (c.ai_tools_list || '').replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
      const cleanSkills = (c.skills_list || '').replace(/[\[\]"']/g, '').split(',').map(s => s.trim()).filter(Boolean);

      return `
      <div class="creator-card">
        ${(!isCreator && c.match_score !== undefined) ? `
          <div class="match-score-badge">
            ⚡ ${c.match_score}% Matched Profile
          </div>
        ` : ''}

        <div class="creator-head">
          <img src="${c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="creator-avatar" alt="${c.full_name}">
          <div>
            <div class="creator-name">
              ${c.full_name} 
              ${c.is_verified ? '<span class="badge badge-success" style="font-size:0.65rem; padding:2px 6px;">✓ Verified</span>' : ''}
            </div>
            <div class="creator-spec">${c.specialization || 'AI Creative Director'}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
              ★ ${c.rating || '5.0'} (${c.total_projects_completed || 0} completed projects)
            </div>
          </div>
        </div>

        <p style="font-size:0.825rem; color:var(--text-muted); line-height:1.45; margin-bottom: 0.75rem;">
          ${(c.bio || '').substring(0, 160)}${c.bio && c.bio.length > 160 ? '...' : ''}
        </p>

        <!-- Toolchains & Skills (Hidden for Creators; shown for Brands/Admins) -->
        ${!isCreator ? `
          <div class="tags-cloud">
            ${cleanTools.map(t => `<span class="tag-pill" style="border-color:rgba(59,130,246,0.3); color:#93C5FD;">${t}</span>`).join('')}
            ${cleanSkills.slice(0, 3).map(s => `<span class="tag-pill">${s}</span>`).join('')}
          </div>
        ` : ''}

        <!-- EXPLAINABLE MATCH REASONS & CRITERIA (if matched for Brand) -->
        ${(!isCreator && c.match_reasons && c.match_reasons.length > 0) ? `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.775rem;">
            <strong style="color:#6EE7B7; display:block; margin-bottom:4px;">✓ Why this Creator Matches:</strong>
            <ul style="padding-left:14px; color:#A7F3D0; margin:0;">
              ${c.match_reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${(!isCreator && c.match_unmet && c.match_unmet.length > 0) ? `
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.775rem;">
            <strong style="color:#FCD34D; display:block; margin-bottom:2px;">⚠️ Unmet Criteria:</strong>
            <ul style="padding-left:14px; color:#FDE68A; margin:0;">
              ${c.match_unmet.map(u => `<li>${u}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Rates & Availability -->
        <div style="margin-top:auto; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:1.1rem; font-weight:800; color:var(--text-main);">$${c.day_rate || 450}</span>
            <span style="font-size:0.75rem; color:var(--text-dim);"> / day</span>
          </div>
          <div>
            <span class="badge ${c.availability_status === 'available' ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem;">
              ${c.availability_status === 'available' ? 'Available Now' : c.availability_status}
            </span>
          </div>
        </div>

        <!-- Role-Specific Action Controls -->
        ${isCreator ? `
          <!-- For Creators: Peer info only, no hiring/inviting/shortlisting or portfolio inspector buttons -->
          <div style="margin-top:10px; padding:8px 12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-sm); text-align:center; font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; justify-content:center; gap:6px;">
            <span>🤝 Verified Creator Profile</span>
            <span style="color:var(--text-muted);">•</span>
            <span>Talent Directory</span>
          </div>
        ` : `
          <!-- For Brands: Full discovery & commissioning actions -->
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            <button class="btn btn-outline btn-sm" style="width:100%; border-color:rgba(56, 189, 248, 0.4); color:#38BDF8;" onclick="openCreatorPortfolioModal(${c.id})">
              🔍 View Portfolio & Stills (${c.full_name.split(' ')[0]})
            </button>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="openInviteModal(${c.id}, '${c.full_name}')">
                Invite to Brief
              </button>
              <button class="btn btn-secondary btn-sm" onclick="addToShortlist(${c.id})">
                + Shortlist
              </button>
            </div>
          </div>
        `}
      </div>
    `;
    }).join('');
  } catch (err) {
    console.error("Error filtering creators:", err);
  }
}

function resetDiscoveryFilters() {
  document.getElementById('discMatchBriefSelect').value = '';
  document.getElementById('discSearchInput').value = '';
  document.getElementById('discSpecSelect').value = '';
  document.getElementById('discToolSelect').value = '';
  document.getElementById('discMaxRateInput').value = '';
  document.getElementById('discVerifiedOnly').checked = false;
  triggerDiscoveryFilter();
}

async function addToShortlist(creatorId) {
  if (!currentUser) {
    showToast('Please sign in as a Brand to shortlist talent.', 'error');
    return;
  }
  if (currentUser.role !== 'brand') {
    showToast('Only Brand / Agency accounts can manage shortlists.', 'error');
    return;
  }

  const briefId = document.getElementById('discMatchBriefSelect').value || null;

  try {
    const res = await fetch('/api/brand/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id: creatorId, brief_id: briefId })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
    } else {
      showToast(data.message || 'Error shortlisting creator', 'error');
    }
  } catch (err) {
    showToast('Failed to add creator to shortlist', 'error');
  }
}

async function openInviteModal(creatorId, creatorName) {
  if (!currentUser) {
    showToast('Please sign in as a Brand to invite creators.', 'error');
    return;
  }
  if (currentUser.role !== 'brand') {
    showToast('Only Brand accounts can commission creators.', 'error');
    return;
  }

  document.getElementById('inviteCreatorId').value = creatorId;
  document.getElementById('inviteCreatorName').value = creatorName;

  // Populate briefs in invite modal
  const select = document.getElementById('inviteBriefSelect');
  try {
    const res = await fetch('/api/briefs');
    const briefs = await res.json();
    if (!briefs || briefs.length === 0) {
      showToast('You must create at least one creative brief first!', 'warning');
      navigateTo('brand-dashboard');
      switchBrandTab('briefs');
      return;
    }
    select.innerHTML = briefs.map(b => `<option value="${b.id}">${b.title} (Budget: $${b.budget_max?.toLocaleString()})</option>`).join('');
    openModal('modalSendInvite');
  } catch (err) {
    showToast('Error loading briefs for invitation', 'error');
  }
}

async function submitBrandInvite(e) {
  e.preventDefault();
  const creator_id = document.getElementById('inviteCreatorId').value;
  const brief_id = document.getElementById('inviteBriefSelect').value;
  const message = document.getElementById('inviteMessage').value.trim();

  try {
    const res = await fetch('/api/brand/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id, brief_id, message })
    });
    const data = await res.json();
    if (res.ok) {
      closeModal('modalSendInvite');
      showToast(data.message, 'success');
    } else {
      showToast(data.message || 'Error sending invite', 'error');
    }
  } catch (err) {
    showToast('Failed to send invitation', 'error');
  }
}

// -------------------------------------------------------------
// 4. CREATOR PROFILE & MULTI-FORMAT PORTFOLIO MODAL
// -------------------------------------------------------------
let currentModalCreatorItems = [];

async function openCreatorPortfolioModal(creatorId) {
  try {
    const res = await fetch(`/api/creator/portfolio?creator_id=${creatorId}`);
    const items = await res.json();
    currentModalCreatorItems = Array.isArray(items) ? items : [];

    // Find creator details
    const firstItem = currentModalCreatorItems[0] || {};
    const creatorName = firstItem.creator_name || 'Verified Creator';
    
    // Look up creator from backend
    const crRes = await fetch(`/api/creators`);
    const crList = await crRes.json();
    const c = (Array.isArray(crList) && crList.length > 0) ? crList.find(x => x.id === creatorId) : null;

    document.getElementById('mcpName').innerText = c ? c.full_name : creatorName;
    document.getElementById('mcpAvatar').src = (c && c.avatar_url) ? c.avatar_url : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';
    document.getElementById('mcpSpec').innerText = c ? c.specialization : (firstItem.category || 'AI Creative Director');
    document.getElementById('mcpBio').innerText = c ? c.bio : 'Specialized AI generative artist proficient in multi-model commercial workflows and IP clearance.';
    document.getElementById('mcpRate').innerText = c ? `$${c.day_rate}` : '$950';

    const toolsWrap = document.getElementById('mcpToolsWrap');
    const toolsStr = c ? c.ai_tools_list : (firstItem.tools_used || 'Runway, Midjourney');
    toolsWrap.innerHTML = (toolsStr || '').split(',').slice(0, 3).map(t => `<span class="tag-pill">${t.trim()}</span>`).join('');

    const invBtn = document.getElementById('mcpInviteBtn');
    invBtn.onclick = () => {
      closeModal('modalCreatorPortfolio');
      openInviteModal(creatorId, c ? c.full_name : creatorName);
    };

    renderCreatorPortfolioModalGrid('all');
    openModal('modalCreatorPortfolio');
  } catch (err) {
    console.error("Error opening creator portfolio modal:", err);
    showToast('Failed to load creator portfolio', 'error');
  }
}

function renderCreatorPortfolioModalGrid(filterType = 'all') {
  const grid = document.getElementById('mcpPortfolioGrid');
  if (!grid) return;

  let items = currentModalCreatorItems;
  if (filterType === 'video') {
    items = items.filter(it => it.media_type === 'video' || (it.media_url || it.asset_url || '').endsWith('.mp4'));
  } else if (filterType === 'image') {
    items = items.filter(it => it.media_type === 'image' || !((it.media_url || it.asset_url || '').endsWith('.mp4')));
  }

  if (items.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-dim); grid-column:1/-1; padding:2rem; text-align:center;">No items matching this media type.</p>';
    return;
  }

  grid.innerHTML = items.map(item => {
    const isVid = item.media_type === 'video' || (item.media_url || item.asset_url || '').endsWith('.mp4');
    const badgeText = isVid ? '🎬 4K MP4' : '🖼️ 8K JPG';
    const thumb = item.thumbnail_url || item.media_url || item.asset_url;

    return `
      <div class="portfolio-item-card" onclick="openLightbox('${encodeURIComponent(JSON.stringify(item))}')" style="cursor:pointer;">
        <div class="portfolio-thumb-wrap" style="aspect-ratio:16/9;">
          <img src="${thumb}" class="portfolio-thumb" alt="${item.title}">
          <span class="badge ${isVid ? 'badge-primary' : 'badge-accent'}" style="position:absolute; top:8px; left:8px; font-size:0.65rem;">${badgeText}</span>
          <span class="badge badge-neutral" style="position:absolute; bottom:8px; right:8px; font-size:0.65rem;">${item.aspect_ratio || '16:9'}</span>
        </div>
        <div class="portfolio-body" style="padding:10px;">
          <div style="font-weight:700; font-size:0.85rem; line-height:1.3;">${item.title}</div>
          <div style="font-size:0.725rem; color:var(--cyan); margin-top:3px;">${item.category || (isVid ? 'Video' : 'Stills')}</div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCreatorPortfolioModal(filterType, e) {
  if (e && e.target) {
    document.querySelectorAll('#mcpFilterPills .tag-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
  }
  renderCreatorPortfolioModalGrid(filterType);
}
