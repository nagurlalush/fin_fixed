/**
 * CreatorVerse AI - Core Application & Authentication Controller
 * Manages RBAC state, dynamic navigation, modals, and notifications.
 */

let currentUser = null;
let currentProfile = null;
let activeView = 'landing';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadLandingShowcases();
  setupEventListeners();
});

// -------------------------------------------------------------
// 1. AUTHENTICATION & RBAC STATE
// -------------------------------------------------------------
// keepView=true -> refresh user info only (used after saving a profile) and stay on the current page
async function checkAuth(keepView) {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    
    if (data.authenticated && data.user) {
      currentUser = data.user;
      currentProfile = data.profile;
      renderAuthenticatedUI(keepView);
    } else {
      currentUser = null;
      currentProfile = null;
      renderUnauthenticatedUI();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    renderUnauthenticatedUI();
  }
}

function renderAuthenticatedUI(keepView) {
  document.getElementById('unauthControls').style.display = 'none';
  const authBox = document.getElementById('authControls');
  authBox.style.display = 'flex';

  document.getElementById('navUserName').innerText = currentUser.full_name;
  const roleNames = {
    'creator': 'AI Creator',
    'brand': 'Brand / Agency',
    'admin': 'Platform Admin'
  };
  document.getElementById('navUserRole').innerText = roleNames[currentUser.role] || currentUser.role;
  if (currentUser.avatar_url) {
    document.getElementById('navAvatar').src = currentUser.avatar_url;
  }

  renderRoleNavigation();

  // Stay on the current page after profile saves; otherwise start on the Title page
  if (keepView) return;
  navigateTo('landing');
}

function renderUnauthenticatedUI() {
  document.getElementById('unauthControls').style.display = 'flex';
  document.getElementById('authControls').style.display = 'none';
  const nb = document.getElementById('brandNotificationBtn');
  if (nb) nb.style.display = 'none';
  renderRoleNavigation();
  navigateTo('landing');
}

// Render dynamic navigation bar according to active user role
function renderRoleNavigation() {
  const navList = document.getElementById('mainNavLinks');
  if (!navList) return;
  navList.innerHTML = '';

  // Logo acts as a "Title" button only while on the Title Page
  const brandEl = document.getElementById('navBrand');
  if (brandEl) {
    brandEl.style.cursor = (activeView === 'landing') ? 'pointer' : 'default';
    brandEl.onclick = (activeView === 'landing') ? () => navigateTo('landing') : null;
  }
  
  // Title button shows ONLY when on the Title Page (landing view)
  const titleButtonHtml = (activeView === 'landing')
    ? `<li><button class="nav-btn active" onclick="navigateTo('landing')">Title Page</button></li>`
    : '';

  if (!currentUser) {
    navList.innerHTML = `
      ${titleButtonHtml}
      <li><a href="#pipeline" class="nav-btn">AI Pipeline</a></li>
    `;
    return;
  }

  if (currentUser.role === 'creator') {
    navList.innerHTML = `
      ${titleButtonHtml}
      <li><button class="nav-btn ${activeView === 'creator-dashboard' ? 'active' : ''}" onclick="navigateTo('creator-dashboard')">Creator Studio</button></li>
      <li><button class="nav-btn ${activeView === 'discovery' ? 'active' : ''}" onclick="navigateTo('discovery')">Explore Brands & Talents</button></li>
      <li><button class="nav-btn ${activeView === 'workspace' ? 'active' : ''}" onclick="navigateTo('workspace')">Workspaces</button></li>
    `;
  } else if (currentUser.role === 'brand') {
    navList.innerHTML = `
      ${titleButtonHtml}
      <li><button class="nav-btn ${activeView === 'brand-dashboard' ? 'active' : ''}" onclick="navigateTo('brand-dashboard')">Brand Hub</button></li>
      <li><button class="nav-btn ${activeView === 'discovery' ? 'active' : ''}" onclick="navigateTo('discovery')">Discover Creators</button></li>
      <li><button class="nav-btn ${activeView === 'workspace' ? 'active' : ''}" onclick="navigateTo('workspace')">Workspaces</button></li>
    `;
  } else if (currentUser.role === 'admin') {
    navList.innerHTML = `
      ${titleButtonHtml}
      <li><button class="nav-btn ${activeView === 'admin' ? 'active' : ''}" onclick="navigateTo('admin')">Admin Governance & Queue</button></li>
      <li><button class="nav-btn ${activeView === 'discovery' ? 'active' : ''}" onclick="navigateTo('discovery')">Talent Directory</button></li>
    `;
  }
}

// -------------------------------------------------------------
// 2. VIEW NAVIGATION CONTROLLER
// -------------------------------------------------------------
function navigateTo(viewName) {
  activeView = viewName;
  
  // Hide all views
  document.querySelectorAll('.page-view').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.style.display = viewName === 'landing' ? 'block' : 'block';
    target.classList.add('active');
  }
  
  window.scrollTo(0, 0);
  renderRoleNavigation();
  
  // Trigger sub-view data loading
  if (viewName === 'creator-dashboard' && typeof loadCreatorData === 'function') {
    loadCreatorData();
  } else if (viewName === 'brand-dashboard' && typeof loadBrandData === 'function') {
    loadBrandData();
  } else if (viewName === 'discovery' && typeof loadDiscoveryData === 'function') {
    loadDiscoveryData();
  } else if (viewName === 'workspace' && typeof loadWorkspaceData === 'function') {
    loadWorkspaceData();
  } else if (viewName === 'admin' && typeof loadAdminData === 'function') {
    loadAdminData();
  }
}

function openProfileView() {
  if (!currentUser) return;
  if (currentUser.role === 'creator') {
    navigateTo('creator-dashboard');
    switchCreatorTab('studio');
  } else if (currentUser.role === 'brand') {
    navigateTo('brand-dashboard');
    switchBrandTab('profile');
  } else {
    navigateTo('admin');
  }
}

// -------------------------------------------------------------
// 3. TITLE PAGE PORTAL AUTH & TABS
// -------------------------------------------------------------
function selectAuthTab(role) {
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab${role.charAt(0).toUpperCase() + role.slice(1)}`).classList.add('active');
  document.getElementById('authPortalRole').value = role;
  
  const badge = document.getElementById('portalRoleBadge');
  const regToggle = document.getElementById('registerToggleWrap');
  
  if (role === 'creator') {
    badge.innerText = 'AI Creator Portal';
    badge.className = 'badge badge-primary';
    regToggle.style.display = 'block';
  } else if (role === 'brand') {
    badge.innerText = 'Brand / Agency Portal';
    badge.className = 'badge badge-cyan';
    regToggle.style.display = 'block';
  } else {
    badge.innerText = 'Platform Admin Portal';
    badge.className = 'badge badge-danger';
    regToggle.style.display = 'none'; // Admin registration not public
  }

  // Clear any existing inline error
  const errBox = document.getElementById('loginInlineError');
  if (errBox) errBox.style.display = 'none';
}

function quickFill(email, pwd, role) {
  selectAuthTab(role);
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = pwd;
  const errBox = document.getElementById('loginInlineError');
  if (errBox) errBox.style.display = 'none';
  showToast(`Autofilled demo credentials for ${email}`, 'success');
}

async function handlePortalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const portalRole = document.getElementById('authPortalRole').value;
  
  const errBox = document.getElementById('loginInlineError');
  if (errBox) errBox.style.display = 'none';

  const submitBtn = document.getElementById('loginSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Authenticating...';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, portalRole })
    });
    
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.message || 'Invalid login credentials. Please check your details and try again.';
      if (errBox) {
        errBox.innerText = errMsg;
        errBox.style.display = 'block';
      }
      showToast(errMsg, 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sign In to Selected Portal';
      return;
    }
    
    showToast(data.message, 'success');
    await checkAuth();
    if (currentUser) {
      if (currentUser.role === 'creator') navigateTo('creator-dashboard');
      else if (currentUser.role === 'brand') navigateTo('brand-dashboard');
      else if (currentUser.role === 'admin') navigateTo('admin');
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = 'Network error during authentication. Please retry.';
      errBox.style.display = 'block';
    }
    showToast('Network error during authentication', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Sign In to Selected Portal';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast('Signed out successfully', 'success');
    currentUser = null;
    currentProfile = null;
    renderUnauthenticatedUI();
  } catch (err) {
    console.error(err);
  }
}

async function handleRegistrationAvatarUpload(inputEl) {
  if (!inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const statusEl = document.getElementById('regAvatarStatus');
  const previewImg = document.getElementById('regAvatarPreview');
  const placeholder = document.getElementById('regAvatarPlaceholder');
  const urlInput = document.getElementById('regAvatarUrl');

  if (statusEl) {
    statusEl.innerHTML = `<span style="color:var(--cyan);">⏳ Uploading ${file.name}...</span>`;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success && data.file_url) {
      urlInput.value = data.file_url;
      if (previewImg) {
        previewImg.src = data.file_url;
        previewImg.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#34D399; font-weight:700;">✓ Profile photo attached</span>`;
      }
      showToast('Profile photo uploaded successfully!', 'success');
    } else {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">Upload failed: ${data.error || 'Server error'}</span>`;
      showToast(data.error || 'Failed to upload photo', 'error');
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">Upload network error</span>`;
    showToast('Network error uploading photo', 'error');
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  const role = document.getElementById('regRole').value;
  const full_name = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const avatar_url = document.getElementById('regAvatarUrl').value.trim();

  // Validate mandatory profile photo upload
  if (!avatar_url) {
    showToast('Profile photo is mandatory. Please upload a profile photo to create your account.', 'error');
    const statusEl = document.getElementById('regAvatarStatus');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#EF4444; font-weight:700;">⚠️ Photo is mandatory! Click button above.</span>`;
    }
    const avatarInput = document.getElementById('regAvatarFileInput');
    if (avatarInput) avatarInput.click();
    return;
  }
  
  const payload = { full_name, email, password, role, avatar_url };
  if (role === 'creator') {
    payload.specialization = document.getElementById('regSpecialization').value.trim();
    payload.tools = document.getElementById('regTools').value.trim();
  } else {
    payload.company_name = document.getElementById('regCompanyName').value.trim();
    payload.industry = document.getElementById('regIndustry').value.trim();
    const addrEl = document.getElementById('regCompanyAddress');
    if (addrEl) payload.company_address = addrEl.value.trim();
    const webEl = document.getElementById('regWebsite');
    if (webEl) payload.website = webEl.value.trim();
    const bioEl = document.getElementById('regCompanyBio');
    if (bioEl) payload.company_bio = bioEl.value.trim();
  }
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Registration failed', 'error');
      return;
    }
    
    closeModal('modalRegister');
    if (role === 'creator') {
      showToast('Account registered! Awaiting Platform Admin verification and approval.', 'warning');
    } else {
      showToast(data.message, 'success');
    }
    await checkAuth();
    if (currentUser) {
      if (currentUser.role === 'creator') navigateTo('creator-dashboard');
      else if (currentUser.role === 'brand') navigateTo('brand-dashboard');
    }
  } catch (err) {
    showToast('Error registering account', 'error');
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('fpEmail').value.trim();
  const new_password = document.getElementById('fpNewPassword').value.trim();
  
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, new_password })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Password reset failed', 'error');
      return;
    }
    
    closeModal('modalForgotPassword');
    showToast(data.message, 'success');
  } catch (err) {
    showToast('Error requesting password reset', 'error');
  }
}

// -------------------------------------------------------------
// 4. MODALS & POPUPS
// -------------------------------------------------------------
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('active');
    const v = m.querySelector('video');
    if (v) v.pause();
  }
}

function showAuthModal(type) {
  if (type === 'login') {
    window.scrollTo(0, 0);
    document.getElementById('loginEmail').focus();
  } else {
    openModal('modalRegister');
  }
}

function openRegisterModal() {
  openModal('modalRegister');
}

function openForgotPasswordModal() {
  openModal('modalForgotPassword');
}

function toggleRegRoleFields(role) {
  document.getElementById('regCreatorFields').style.display = role === 'creator' ? 'block' : 'none';
  document.getElementById('regBrandFields').style.display = role === 'brand' ? 'block' : 'none';
}

function showRolePortal(role) {
  selectAuthTab(role);
  window.scrollTo(0, 0);
  document.getElementById('loginEmail').focus();
}

// -------------------------------------------------------------
// 5. TOAST NOTIFICATION UTILITY
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
  toast.innerHTML = `<span><strong>${icon}</strong> ${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -------------------------------------------------------------
// 5.5 MANUAL FILE UPLOAD HELPER
// -------------------------------------------------------------
async function handleManualFileUpload(inputEl, targetUrlInputId, statusElId, previewImgId = null, previewWrapId = null) {
  if (!inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const statusEl = document.getElementById(statusElId);
  const targetUrlInput = document.getElementById(targetUrlInputId);
  const previewImg = previewImgId ? document.getElementById(previewImgId) : null;
  const previewWrap = previewWrapId ? document.getElementById(previewWrapId) : null;

  if (statusEl) {
    statusEl.innerHTML = `<span style="color:var(--cyan); animation: pulseGlow 1.5s infinite;">⏳ Uploading ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)...</span>`;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success && data.file_url) {
      if (targetUrlInput) {
        targetUrlInput.value = data.file_url;
      }
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#34D399; font-weight:700;">✓ Attached: ${file.name} (${data.file_size})</span>`;
      }
      if (previewImg) {
        // If file is image, show preview
        if (file.type.startsWith('image/')) {
          previewImg.src = data.file_url;
        } else {
          previewImg.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300';
        }
      }
      if (previewWrap) {
        previewWrap.style.display = 'block';
      }
      showToast(`File '${file.name}' attached successfully!`, 'success');
    } else {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">✕ Upload failed: ${data.error || 'Server error'}</span>`;
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    console.error('File upload failed:', err);
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">✕ Network upload error</span>`;
    showToast('Network upload error', 'error');
  }
}

// -------------------------------------------------------------
// 6. LANDING SHOWCASES SPOTLIGHT
// -------------------------------------------------------------
async function loadLandingShowcases() {
  const grid = document.getElementById('landingShowcasesGrid');
  if (!grid) return;
  
  try {
    const res = await fetch('/api/creator/portfolio');
    const items = await res.json();
    
    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-dim)">No showcases available.</p>';
      return;
    }
    
    grid.innerHTML = items.slice(0, 8).map(item => {
      const isVid = item.media_type === 'video' || (item.media_url || item.asset_url || '').endsWith('.mp4');
      const badgeText = isVid ? '🎬 4K MP4' : '🖼️ 8K JPG';
      return `
        <div class="portfolio-item-card" onclick="openLightbox('${encodeURIComponent(JSON.stringify(item))}')">
          <div class="portfolio-thumb-wrap">
            <img src="${item.thumbnail_url || item.media_url || item.asset_url}" class="portfolio-thumb" alt="${item.title}">
            <span class="badge ${isVid ? 'badge-primary' : 'badge-accent'}" style="position:absolute; top:8px; left:8px; font-size:0.65rem;">${badgeText}</span>
            <span class="badge badge-neutral" style="position:absolute; bottom:8px; right:8px; font-size:0.65rem;">${item.aspect_ratio || '16:9'}</span>
          </div>
          <div class="portfolio-body">
            <div style="font-size:0.95rem; font-weight:700;">${item.title}</div>
            <div style="font-size:0.75rem; color:var(--cyan);">${item.creator_name ? 'By ' + item.creator_name : 'Verified Showcase'}</div>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">${(item.tools_used || '').split(',').slice(0,2).join(', ')}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading landing showcases:", err);
  }
}

function openLightbox(itemEncoded) {
  const item = JSON.parse(decodeURIComponent(itemEncoded));
  document.getElementById('lbTitle').innerText = item.title;
  
  const imgEl = document.getElementById('lbImage');
  const videoEl = document.getElementById('lbVideo');
  const videoSrc = document.getElementById('lbVideoSrc');

  const assetUrl = item.media_url || item.asset_url || item.thumbnail_url || '';
  const isVideo = item.media_type === 'video' || assetUrl.endsWith('.mp4') || assetUrl.endsWith('.webm') || assetUrl.endsWith('.mov');

  if (isVideo && videoEl) {
    imgEl.style.display = 'none';
    videoEl.style.display = 'block';
    const safeUrl = (assetUrl && !assetUrl.includes('commondatastorage.googleapis.com')) ? assetUrl : '/static/uploads/sample_render.mp4';
    videoSrc.src = safeUrl;
    videoEl.load();
    videoEl.play().catch(e => console.log('Autoplay deferred:', e));
  } else {
    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
    }
    imgEl.style.display = 'block';
    imgEl.src = assetUrl;
  }

  document.getElementById('lbWorkflow').innerText = item.workflow_summary || item.workflow_description || 'Custom iterative prompt synthesis';
  document.getElementById('lbRights').innerText = item.commercial_rights_statement || item.commercial_rights || 'Full commercial buyout rights cleared';
  openModal('modalLightbox');
}

function setupEventListeners() {
  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal.id === 'modalCameraCapture') {
          closeCameraModal();
        } else {
          modal.classList.remove('active');
          const v = modal.querySelector('video');
          if (v) v.pause();
        }
      }
    });
  });

  // Close camera or active modal on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const cameraModal = document.getElementById('modalCameraCapture');
      if (cameraModal && cameraModal.classList.contains('active')) {
        closeCameraModal();
      }
    }
  });
}








// -------------------------------------------------------------
// 10. WEBCAM CAMERA CAPTURE CONTROLLER
// -------------------------------------------------------------
let activeCameraStream = null;
let cameraTargetInputId = null;
let cameraPreviewImgId = null;
let cameraStatusElId = null;
let cameraOnSavedCallback = null;
let cameraCapturedBlob = null;

async function openCameraModal(targetInputId, previewImgId, statusElId = null, onSavedCallback = null) {
  cameraTargetInputId = targetInputId;
  cameraPreviewImgId = previewImgId;
  cameraStatusElId = statusElId;
  cameraOnSavedCallback = onSavedCallback;
  cameraCapturedBlob = null;

  const video = document.getElementById('cameraVideo');
  const snapshotPreview = document.getElementById('cameraSnapshotPreview');
  const loadingMsg = document.getElementById('cameraLoadingMsg');
  const note = document.getElementById('cameraStatusNote');
  const btnSnap = document.getElementById('btnSnapPhoto');
  const btnRetake = document.getElementById('btnRetakePhoto');
  const btnUse = document.getElementById('btnUsePhoto');

  // Reset visual elements
  if (video) video.style.display = 'block';
  if (snapshotPreview) {
    snapshotPreview.style.display = 'none';
    snapshotPreview.src = '';
  }
  if (loadingMsg) {
    loadingMsg.style.display = 'block';
    loadingMsg.innerHTML = 'Connecting to webcam...';
  }
  if (note) note.innerHTML = 'Position your face or brand subject in frame, then click <strong>Snap Photo</strong>.';
  if (btnSnap) {
    btnSnap.style.display = 'inline-block';
    btnSnap.disabled = true;
  }
  if (btnRetake) btnRetake.style.display = 'none';
  if (btnUse) {
    btnUse.style.display = 'none';
    btnUse.disabled = false;
    btnUse.innerText = '✓ Use This Photo';
  }

  openModal('modalCameraCapture');

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });
    activeCameraStream = stream;
    if (video) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        if (loadingMsg) loadingMsg.style.display = 'none';
        if (btnSnap) btnSnap.disabled = false;
      };
    }
  } catch (err) {
    console.error('Camera access error:', err);
    if (loadingMsg) {
      loadingMsg.style.display = 'block';
      loadingMsg.innerHTML = `<span style="color:#EF4444; font-weight:600;">⚠️ Camera unavailable (${err.name || 'Permission denied'}). Please ensure camera permissions are enabled, or use the file upload option.</span>`;
    }
    showToast('Could not access camera. Please check permissions or upload a file.', 'error');
  }
}

function captureCameraSnapshot() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const preview = document.getElementById('cameraSnapshotPreview');
  const note = document.getElementById('cameraStatusNote');
  const btnSnap = document.getElementById('btnSnapPhoto');
  const btnRetake = document.getElementById('btnRetakePhoto');
  const btnUse = document.getElementById('btnUsePhoto');

  if (!video || !canvas || !preview) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  // Draw mirrored to match video transform: scaleX(-1)
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  preview.src = dataUrl;
  video.style.display = 'none';
  preview.style.display = 'block';

  canvas.toBlob((blob) => {
    cameraCapturedBlob = blob;
  }, 'image/jpeg', 0.92);

  if (btnSnap) btnSnap.style.display = 'none';
  if (btnRetake) btnRetake.style.display = 'inline-block';
  if (btnUse) btnUse.style.display = 'inline-block';
  if (note) note.innerHTML = '<span style="color:#34D399; font-weight:600;">✓ Snapshot captured!</span> Click <strong>Use This Photo</strong> to apply or <strong>Retake</strong>.';
}

function retakeCameraSnapshot() {
  const video = document.getElementById('cameraVideo');
  const preview = document.getElementById('cameraSnapshotPreview');
  const note = document.getElementById('cameraStatusNote');
  const btnSnap = document.getElementById('btnSnapPhoto');
  const btnRetake = document.getElementById('btnRetakePhoto');
  const btnUse = document.getElementById('btnUsePhoto');

  cameraCapturedBlob = null;
  if (video) video.style.display = 'block';
  if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
  if (btnSnap) {
    btnSnap.style.display = 'inline-block';
    btnSnap.disabled = false;
  }
  if (btnRetake) btnRetake.style.display = 'none';
  if (btnUse) btnUse.style.display = 'none';
  if (note) note.innerHTML = 'Position your face or brand subject in frame, then click <strong>Snap Photo</strong>.';
}

async function confirmAndUploadCameraPhoto() {
  if (!cameraCapturedBlob) {
    showToast('No snapshot captured. Click Snap Photo first.', 'error');
    return;
  }

  const btnUse = document.getElementById('btnUsePhoto');
  if (btnUse) {
    btnUse.disabled = true;
    btnUse.innerText = 'Uploading snapshot...';
  }

  const formData = new FormData();
  formData.append('file', cameraCapturedBlob, `camera_${Date.now()}.jpg`);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success && data.file_url) {
      const fileUrl = data.file_url;
      // Update target input value
      if (cameraTargetInputId) {
        const inputEl = document.getElementById(cameraTargetInputId);
        if (inputEl) inputEl.value = fileUrl;
      }
      // Update preview image
      if (cameraPreviewImgId) {
        const imgEl = document.getElementById(cameraPreviewImgId);
        if (imgEl) {
          imgEl.src = fileUrl;
          imgEl.style.display = 'block';
        }
      }
      // If registration placeholder is present, hide it
      const regPlaceholder = document.getElementById('regAvatarPlaceholder');
      if (regPlaceholder && cameraTargetInputId === 'regAvatarUrl') {
        regPlaceholder.style.display = 'none';
      }
      // Update status element
      if (cameraStatusElId) {
        const statusEl = document.getElementById(cameraStatusElId);
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34D399; font-weight:700;">✓ Photo captured with camera</span>`;
        }
      }
      // Invoke callback if provided
      if (typeof cameraOnSavedCallback === 'function') {
        await cameraOnSavedCallback(fileUrl);
      }
      showToast('Camera photo captured and attached successfully!', 'success');
      closeCameraModal();
    } else {
      showToast(data.error || 'Failed to upload camera snapshot', 'error');
      if (btnUse) {
        btnUse.disabled = false;
        btnUse.innerText = '✓ Use This Photo';
      }
    }
  } catch (err) {
    console.error('Camera upload error:', err);
    showToast('Network error uploading snapshot', 'error');
    if (btnUse) {
      btnUse.disabled = false;
      btnUse.innerText = '✓ Use This Photo';
    }
  }
}

function closeCameraModal() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach(track => {
      try { track.stop(); } catch(e) {}
    });
    activeCameraStream = null;
  }
  const video = document.getElementById('cameraVideo');
  if (video) video.srcObject = null;

  closeModal('modalCameraCapture');
}

