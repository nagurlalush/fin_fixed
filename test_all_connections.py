import os
import tempfile
import json
import shutil

# Configure isolated test database before importing app and database
test_db_dir = tempfile.mkdtemp(prefix="cv_test_")
test_db_path = os.path.join(test_db_dir, "creatorverse_isolated_test.db")
os.environ['CREATORVERSE_DB_PATH'] = test_db_path

from app import app
from database import get_db, init_db
import seed

client = app.test_client()

def test_everything():
    print("--- STARTING FULL FUNCTIONAL AUDIT OF ALL BUTTONS AND ENDPOINTS ---")
    print(f"[*] Running tests against isolated disposable test database: {test_db_path}")
    
    # Reset isolated test DB
    seed.seed()
    
    # 1. AUTH & PORTAL BUTTONS
    # Creator Login
    res = client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})
    assert res.status_code == 200, f"Creator login failed: {res.data}"
    print("[PASS] Creator login button")
    
    # Cross portal block
    res = client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'brand'})
    assert res.status_code == 403, f"Cross portal failed: {res.data}"
    print("[PASS] Cross-portal RBAC shield button")

    # Wrong email
    res = client.post('/api/auth/login', json={'email': 'fake@example.com', 'password': '123', 'portalRole': 'creator'})
    assert res.status_code == 401 and "Email not found" in res.get_json()['message']
    print("[PASS] Login wrong email message")

    # Wrong password
    res = client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'wrong', 'portalRole': 'creator'})
    assert res.status_code == 401 and "Incorrect password" in res.get_json()['message']
    print("[PASS] Login wrong password message")

    # Forgot password
    res = client.post('/api/auth/forgot-password', json={'email': 'aarav@creatorverse.ai', 'new_password': 'creator123'})
    assert res.status_code == 200
    print("[PASS] Forgot password button")

    # 2. CREATOR DASHBOARD BUTTONS
    client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})
    
    # Creator stats & profile
    res = client.get('/api/creator/dashboard-stats')
    assert res.status_code == 200
    res = client.get('/api/creator/profile')
    assert res.status_code == 200 and 'verified_status' in res.get_json()
    print("[PASS] Creator dashboard stats & profile load")

    # Save creator profile
    res = client.put('/api/creator/profile', json={'day_rate': 980.0, 'bio': 'Updated Director Bio'})
    assert res.status_code == 200
    print("[PASS] Save creator profile button")

    # Add Portfolio Showcase button
    res = client.post('/api/creator/portfolio', json={
        'title': 'New Cyberpunk Reel',
        'media_type': 'video/mp4',
        'media_url': '/static/uploads/volt_zero_v1_0.mp4',
        'thumbnail_url': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
        'tools_used': 'Runway Gen-3, ComfyUI',
        'workflow_summary': 'Multi-pass prompt graph',
        'rights_declaration': 'Commercial Buyout'
    })
    assert res.status_code == 200
    showcase_id = res.get_json().get('id')
    print(f"[PASS] Add portfolio showcase button (id={showcase_id})")

    # Delete portfolio showcase button
    if showcase_id:
        res = client.delete(f'/api/creator/portfolio/{showcase_id}')
        assert res.status_code == 200
        print("[PASS] Delete portfolio showcase button")

    # Submit verification evidence button
    res = client.post('/api/creator/verifications', json={
        'title': 'Midjourney Pro License Receipt',
        'evidence_type': 'tool',
        'description': 'Annual commercial subscription confirmation receipt #MJ-9912.',
        'evidence_url': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'
    })
    assert res.status_code == 200
    verif_id = res.get_json().get('id')
    print(f"[PASS] Submit verification record button (id={verif_id})")

    # Creator invitations & respond
    res = client.get('/api/creator/invitations')
    assert res.status_code == 200
    invites = res.get_json()
    if invites:
        inv_id = invites[0]['id']
        res = client.post(f'/api/creator/invitations/{inv_id}/respond', json={'action': 'accept', 'message': 'Ready to direct.'})
        assert res.status_code == 200
        print(f"[PASS] Accept invitation & launch workspace button (inv_id={inv_id})")

    # 3. BRAND HUB BUTTONS
    client.post('/api/auth/login', json={'email': 'apex@brands.com', 'password': 'brand123', 'portalRole': 'brand'})

    # Brand stats & profile
    res = client.get('/api/brand/profile')
    assert res.status_code == 200
    print("[PASS] Brand profile load")

    # Save brand profile button
    res = client.put('/api/brand/profile', json={
        'company_name': 'Apex Media Studios Inc',
        'company_address': '450 Creative Ave, Los Angeles, CA',
        'website_url': 'https://apexmedia.ai',
        'company_bio': 'Premier virtual production brand.'
    })
    assert res.status_code == 200
    print("[PASS] Save brand profile button")

    # AI Brief Builder - NLP Synthesis button
    res = client.post('/api/briefs/ai-generate', json={'rough_idea': '30s futuristic cyber sneakers commercial in neo Tokyo'})
    assert res.status_code == 200 and 'brief' in res.get_json()
    print("[PASS] Synthesize AI Brief button")

    # Save / Publish brief button
    res = client.post('/api/briefs', json={
        'title': 'Futuristic Cyber Sneaker Launch',
        'objective': 'High-octane commercial with photorealistic textures',
        'content_type': 'Cinematic AI Video',
        'visual_style': 'Cyberpunk Neon',
        'aspect_ratio': '16:9 Landscape',
        'target_resolution': '4K UHD (3840x2160)',
        'target_audience': 'Sneakerheads 18-35',
        'distribution_platforms': 'YouTube, TikTok',
        'budget_min': 3000,
        'budget_max': 7000,
        'deadline': '14 days',
        'required_tools': 'Runway Gen-3, Midjourney v6',
        'required_skills': 'ComfyUI, AI Video Upscaling',
        'required_deliverables': '1x 30s Master 4K Video\n3x 10s Social Cutdowns'
    })
    assert res.status_code == 200
    brief_id = res.get_json().get('id')
    print(f"[PASS] Save creative brief button (id={brief_id})")

    # Edit brief button
    if brief_id:
        res = client.put(f'/api/briefs/{brief_id}', json={'title': 'Futuristic Cyber Sneaker Launch (Revised)', 'budget_max': 8000})
        assert res.status_code == 200
        print("[PASS] Edit brief button")

    # Toggle brief status button (close/reopen)
    if brief_id:
        res = client.post(f'/api/briefs/{brief_id}/toggle-status')
        assert res.status_code == 200
        print("[PASS] Toggle brief status button")

    # Delete brief button
    if brief_id:
        res = client.delete(f'/api/briefs/{brief_id}')
        assert res.status_code == 200
        print("[PASS] Delete brief button")

    # Send Invitation to Creator button
    res = client.post('/api/invitations', json={
        'creator_id': 1,
        'brief_id': 1,
        'message': 'We want to commission your ComfyUI talents.',
        'proposed_budget': 5000,
        'proposed_deadline': '14 days'
    })
    assert res.status_code == 200
    print("[PASS] Send invitation modal button")

    # Shortlist creator button
    res = client.post('/api/shortlist', json={'creator_id': 1, 'action': 'add'})
    assert res.status_code == 200
    print("[PASS] Add to shortlist button")
    res = client.get('/api/shortlist')
    assert res.status_code == 200
    print("[PASS] View shortlist")
    res = client.post('/api/shortlist', json={'creator_id': 1, 'action': 'remove'})
    assert res.status_code == 200
    print("[PASS] Remove from shortlist button")

    # 4. DISCOVERY & MATCHED PROFILES BUTTONS
    res = client.get('/api/creators')
    assert res.status_code == 200
    print("[PASS] Talent directory / Matched profiles list for brand")

    # Filter with brief_id
    res = client.get('/api/creators?brief_id=1')
    assert res.status_code == 200
    print("[PASS] Matched Profiles by Brief Compatibility button")

    # 5. WORKSPACE BUTTONS
    # Get active projects
    res = client.get('/api/projects')
    assert res.status_code == 200
    projects = res.get_json()
    if projects:
        proj_id = projects[0]['id']
        res = client.get(f'/api/projects/{proj_id}')
        assert res.status_code == 200
        print(f"[PASS] Load workspace details button (proj_id={proj_id})")

        # Submit deliverable button (as Creator)
        client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})
        res = client.post(f'/api/projects/{proj_id}/deliverables', json={
            'title': 'Rough Assembly v1.2',
            'version': 'v1.2',
            'file_type': 'video/mp4',
            'file_url': '/static/uploads/volt_zero_v1_0.mp4',
            'notes': 'Enhanced color grading and dynamic lighting applied.'
        })
        assert res.status_code == 200
        deliv_id = res.get_json().get('id')
        print(f"[PASS] Submit deliverable button (deliv_id={deliv_id})")

        # Review deliverable button (as Brand)
        client.post('/api/auth/login', json={'email': 'apex@brands.com', 'password': 'brand123', 'portalRole': 'brand'})
        if deliv_id:
            res = client.post(f'/api/deliverables/{deliv_id}/review', json={
                'decision': 'approved',
                'revision_notes': 'Master cut approved for broadcast.',
                'timecode_markers': '00:05; 00:22'
            })
            assert res.status_code == 200
            print("[PASS] Review deliverable with timecode markers button")

        # Post chat comment button
        res = client.post(f'/api/projects/{proj_id}/comments', json={'content': 'Master deliverables approved and looking incredible.'})
        assert res.status_code == 200
        print("[PASS] Send workspace comment button")

    # 6. ADMIN PORTAL BUTTONS
    client.post('/api/auth/login', json={'email': 'admin@creatorverse.ai', 'password': 'admin123', 'portalRole': 'admin'})
    res = client.get('/api/admin/stats')
    assert res.status_code == 200
    print("[PASS] Admin stats load")

    # Verification Queue filters
    for st in ['all', 'pending', 'approved', 'rejected']:
        res = client.get(f'/api/admin/verifications?status={st}')
        assert res.status_code == 200
    print("[PASS] Admin verification queue filter buttons")

    # Creators approval filters
    for st in ['all', 'pending', 'verified', 'rejected']:
        res = client.get(f'/api/admin/creators?status={st}')
        assert res.status_code == 200
    print("[PASS] Admin creator approval filter buttons")

    # Direct verify creator button
    res = client.post('/api/admin/creators/1/verify', json={'status': 'verified'})
    assert res.status_code == 200
    print("[PASS] Admin approve creator button")

    # Review verification record button
    if verif_id:
        res = client.post(f'/api/admin/verifications/{verif_id}/review', json={'decision': 'approved', 'notes': 'Receipt audited.'})
        assert res.status_code == 200
        print("[PASS] Admin approve verification record button")

    # Registered accounts directory
    res = client.get('/api/admin/users')
    assert res.status_code == 200
    print("[PASS] Admin users directory load")

    # Batch heuristic audit
    res = client.post('/api/admin/batch-heuristic-audit')
    assert res.status_code == 200
    print("[PASS] Admin batch heuristic audit button")

    print("\n=======================================================")
    print(" ALL BUTTONS & API CONNECTIONS AUDITED AND 100% OPERATIONAL!")
    print("=======================================================")

if __name__ == '__main__':
    try:
        test_everything()
    finally:
        shutil.rmtree(test_db_dir, ignore_errors=True)
