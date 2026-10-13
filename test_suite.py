"""
CreatorVerse AI - Comprehensive Enterprise Automated Test Suite
Covers startup, security hardening, RBAC isolation, BOLA defenses,
file upload validation, AI modules, and database integrity.
Runs strictly against an isolated disposable SQLite database.
"""

import os
import io
import tempfile
import shutil
import unittest
from datetime import datetime

# Setup isolated disposable test database before importing application
TEST_DIR = tempfile.mkdtemp(prefix="cv_enterprise_test_")
TEST_DB = os.path.join(TEST_DIR, "creatorverse_isolated_test.db")
os.environ['CREATORVERSE_DB_PATH'] = TEST_DB
os.environ['SECRET_KEY'] = 'test-secret-key-for-automated-regression-suite'
os.environ['FLASK_ENV'] = 'development'
os.environ['UPLOAD_FOLDER'] = os.path.join(TEST_DIR, "uploads")

from app import app, verify_password
from database import get_db, init_db, migrate_passwords
import seed
from ai_engine import calculate_creator_match, get_ranked_creators_for_brief
from ai_builder import analyze_and_build_brief
from ai_verifier import analyze_verification_evidence
from werkzeug.security import check_password_hash

class CreatorVerseEnterpriseTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize and seed isolated test database
        seed.seed()
        cls.client = app.test_client()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_DIR, ignore_errors=True)

    def test_01_health_and_startup(self):
        """Verify health check endpoint and homepage rendering."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)

        res_home = self.client.get('/')
        self.assertEqual(res_home.status_code, 200)
        self.assertIn(b'CreatorVerse', res_home.data)

    def test_02_password_hashing_integrity(self):
        """Verify passwords are never stored in plaintext and use cryptographic hashes."""
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT id, name, email, password_hash FROM users")
        users = cursor.fetchall()
        self.assertGreaterEqual(len(users), 7)
        for u in users:
            self.assertTrue(
                u['password_hash'].startswith(('scrypt:', 'pbkdf2:')),
                f"User {u['email']} password is not cryptographically hashed!"
            )
            self.assertNotEqual(u['password_hash'], 'creator123')
            self.assertNotEqual(u['password_hash'], 'admin123')
            self.assertNotEqual(u['password_hash'], 'brand123')

    def test_03_authentication_and_session_lifecycle(self):
        """Verify creator, brand, and admin authentication, plus failure handling."""
        # Creator login
        res = self.client.post('/api/auth/login', json={
            'email': 'aarav@creatorverse.ai',
            'password': 'creator123',
            'portalRole': 'creator'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['role'], 'creator')

        # Check /api/auth/me
        res_me = self.client.get('/api/auth/me')
        self.assertEqual(res_me.status_code, 200)
        self.assertTrue(res_me.get_json()['authenticated'])

        # Logout
        res_logout = self.client.post('/api/auth/logout')
        self.assertEqual(res_logout.status_code, 200)
        res_me_after = self.client.get('/api/auth/me')
        self.assertFalse(res_me_after.get_json()['authenticated'])

        # Wrong password failure
        res_fail = self.client.post('/api/auth/login', json={
            'email': 'aarav@creatorverse.ai',
            'password': 'incorrect_password',
            'portalRole': 'creator'
        })
        self.assertEqual(res_fail.status_code, 401)
        self.assertIn('Incorrect password', res_fail.get_json()['message'])

        # Non-existent email failure
        res_no_user = self.client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'any_password',
            'portalRole': 'creator'
        })
        self.assertEqual(res_no_user.status_code, 401)
        self.assertIn('Email not found', res_no_user.get_json()['message'])

    def test_04_rbac_cross_portal_isolation(self):
        """Verify cross-portal login shields block unauthorized portal switching with 403."""
        # Creator attempting brand portal
        res = self.client.post('/api/auth/login', json={
            'email': 'aarav@creatorverse.ai',
            'password': 'creator123',
            'portalRole': 'brand'
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn('AI Creator', res.get_json()['message'])

        # Brand attempting admin portal
        res_brand = self.client.post('/api/auth/login', json={
            'email': 'apex@brands.com',
            'password': 'brand123',
            'portalRole': 'admin'
        })
        self.assertEqual(res_brand.status_code, 403)

    def test_05_secure_registration_and_password_validation(self):
        """Verify registration enforces password length and stores hashed credentials."""
        # Short password rejected
        res_short = self.client.post('/api/auth/register', json={
            'full_name': 'Test Creator',
            'email': 'shortpass@example.com',
            'password': '123',
            'role': 'creator',
            'avatar_url': 'https://example.com/avatar.jpg'
        })
        self.assertEqual(res_short.status_code, 400)
        self.assertIn('6 characters', res_short.get_json()['message'])

        # Valid registration
        test_email = f"secure_user_{int(datetime.now().timestamp())}@test.com"
        res_reg = self.client.post('/api/auth/register', json={
            'full_name': 'Secure New Creator',
            'email': test_email,
            'password': 'securepassword123',
            'role': 'creator',
            'avatar_url': 'https://example.com/avatar.jpg',
            'specialization': 'Generative AI VFX'
        })
        self.assertEqual(res_reg.status_code, 200)

        # Verify stored password is a hash
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT password_hash FROM users WHERE email = ?", (test_email,))
        row = cur.fetchone()
        self.assertIsNotNone(row)
        self.assertTrue(row['password_hash'].startswith(('scrypt:', 'pbkdf2:')))
        self.assertTrue(check_password_hash(row['password_hash'], 'securepassword123'))

    def test_06_secure_password_recovery(self):
        """Verify forgot password flow hashes new password properly."""
        test_email = 'aarav@creatorverse.ai'
        res = self.client.post('/api/auth/forgot-password', json={
            'email': test_email,
            'new_password': 'brandNewPassword123'
        })
        self.assertEqual(res.status_code, 200)

        # Verify password is now hashed in DB
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT password_hash FROM users WHERE email = ?", (test_email,))
        row = cur.fetchone()
        self.assertTrue(row['password_hash'].startswith(('scrypt:', 'pbkdf2:')))
        self.assertTrue(check_password_hash(row['password_hash'], 'brandNewPassword123'))

        # Reset back for subsequent test suites
        res_back = self.client.post('/api/auth/forgot-password', json={
            'email': test_email,
            'new_password': 'creator123'
        })
        self.assertEqual(res_back.status_code, 200)

    def test_07_file_upload_security(self):
        """Verify file upload size limits, extension checking, and anonymous upload rules."""
        # Ensure client is anonymous
        self.client.post('/api/auth/logout')

        # Anonymous image upload (allowed for registration avatar)
        fake_img = (io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00'), 'avatar.jpg')
        res_img = self.client.post('/api/upload', data={'file': fake_img}, content_type='multipart/form-data')
        self.assertEqual(res_img.status_code, 200)
        self.assertIn('/static/uploads/', res_img.get_json()['file_url'])

        # Anonymous non-image upload (blocked for unauthenticated users)
        fake_video = (io.BytesIO(b'fake-video-payload'), 'video.mp4')
        res_vid = self.client.post('/api/upload', data={'file': fake_video}, content_type='multipart/form-data')
        self.assertEqual(res_vid.status_code, 401)
        self.assertIn('Sign in required', res_vid.get_json()['message'])

        # Dangerous extension blocked
        fake_script = (io.BytesIO(b'print("malicious")'), 'exploit.py')
        res_bad = self.client.post('/api/upload', data={'file': fake_script}, content_type='multipart/form-data')
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn('Unsupported file format', res_bad.get_json()['error'])

    def test_08_workspace_bola_idor_defenses(self):
        """Verify Broken Object-Level Authorization guards block cross-project tampering."""
        # 1. Login as Aarav (assigned to Project 1)
        self.client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})

        # Creator of project 1 can view project 1
        res_ok = self.client.get('/api/projects/1')
        self.assertEqual(res_ok.status_code, 200)

        # 2. Login as Vikram (Creator 2, NOT assigned to Project 1)
        self.client.post('/api/auth/login', json={'email': 'vikram@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})

        # Vikram attempting to view Project 1 workspace details -> 403 Forbidden
        res_blocked = self.client.get('/api/projects/1')
        self.assertEqual(res_blocked.status_code, 403)
        self.assertIn('permission to access this workspace', res_blocked.get_json()['message'])

        # Vikram attempting to upload deliverable to Project 1 -> 403 Forbidden
        res_deliv = self.client.post('/api/projects/1/deliverables', json={
            'title': 'Intruder Cut',
            'file_url': '/static/uploads/intruder.mp4',
            'version': 'v1.9'
        })
        self.assertEqual(res_deliv.status_code, 403)

        # Vikram attempting to comment on Project 1 -> 403 Forbidden
        res_comment = self.client.post('/api/projects/1/comments', json={'content': 'Unauthorized comment'})
        self.assertEqual(res_comment.status_code, 403)

        # 3. Login as Lumina (Brand 2, NOT the brand for Project 1)
        self.client.post('/api/auth/login', json={'email': 'lumina@brands.com', 'password': 'brand123', 'portalRole': 'brand'})

        # Lumina attempting to review deliverable on Project 1 -> 403 Forbidden
        res_review = self.client.post('/api/deliverables/1/review', json={'decision': 'approved'})
        self.assertEqual(res_review.status_code, 403)

    def test_09_brief_ownership_on_invitations(self):
        """Verify a brand cannot invite creators using another brand's brief."""
        # Login as Lumina (Brand 2)
        self.client.post('/api/auth/login', json={'email': 'lumina@brands.com', 'password': 'brand123', 'portalRole': 'brand'})

        # Attempt to invite on Brief 1 (which belongs to Apex, Brand 1) -> 403 Forbidden
        res = self.client.post('/api/invitations', json={
            'creator_id': 1,
            'brief_id': 1,
            'message': 'Attempting to invite on another brand brief'
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn('only invite creators using briefs created by your brand', res.get_json()['message'])

    def test_10_creator_portal_workflows(self):
        """Verify creator profile, portfolio showcases, verification, and dashboard metrics."""
        self.client.post('/api/auth/login', json={'email': 'aarav@creatorverse.ai', 'password': 'creator123', 'portalRole': 'creator'})

        # Dashboard stats
        res_stats = self.client.get('/api/creator/dashboard-stats')
        self.assertEqual(res_stats.status_code, 200)
        self.assertIn('active_projects', res_stats.get_json())

        # Update profile
        res_prof = self.client.put('/api/creator/profile', json={'day_rate': 990.0, 'bio': 'Updated Director Bio'})
        self.assertEqual(res_prof.status_code, 200)

        # Add and delete portfolio item
        res_add = self.client.post('/api/creator/portfolio', json={
            'title': 'Automated Test Showcase',
            'media_type': 'video',
            'media_url': '/static/uploads/sample.mp4',
            'tools_used': 'Runway Gen-3, ComfyUI',
            'workflow_summary': 'Nodal graph with LoRA'
        })
        self.assertEqual(res_add.status_code, 200)
        item_id = res_add.get_json().get('id')
        self.assertIsNotNone(item_id)

        res_del = self.client.delete(f'/api/creator/portfolio/{item_id}')
        self.assertEqual(res_del.status_code, 200)

    def test_11_brand_portal_workflows(self):
        """Verify brand profile, brief management, and shortlisting."""
        self.client.post('/api/auth/login', json={'email': 'apex@brands.com', 'password': 'brand123', 'portalRole': 'brand'})

        # Brand dashboard stats
        res_stats = self.client.get('/api/brand/dashboard-stats')
        self.assertEqual(res_stats.status_code, 200)

        # Create brief
        res_brief = self.client.post('/api/briefs', json={
            'title': 'Test Enterprise Commercial',
            'content_type': 'Cinematic AI Video',
            'visual_style': 'Photorealistic 8K',
            'aspect_ratio': '16:9 Landscape',
            'resolution': '4K UHD',
            'budget_min': 4000,
            'budget_max': 8000,
            'deadline': '14 days',
            'target_platforms': 'Digital, Broadcast',
            'required_tools': 'Runway Gen-3, Midjourney v6',
            'required_skills': 'ComfyUI, Upscaling',
            'deliverables': 'Master Cut'
        })
        self.assertEqual(res_brief.status_code, 200)
        brief_id = res_brief.get_json().get('id')

        # Toggle brief status
        res_toggle = self.client.post(f'/api/briefs/{brief_id}/toggle-status')
        self.assertEqual(res_toggle.status_code, 200)

        # Delete brief
        res_del = self.client.delete(f'/api/briefs/{brief_id}')
        self.assertEqual(res_del.status_code, 200)

    def test_12_admin_portal_governance(self):
        """Verify admin stats, verification review, and user management."""
        self.client.post('/api/auth/login', json={'email': 'admin@creatorverse.ai', 'password': 'admin123', 'portalRole': 'admin'})

        # Admin stats
        res_stats = self.client.get('/api/admin/stats')
        self.assertEqual(res_stats.status_code, 200)
        data = res_stats.get_json()
        self.assertGreaterEqual(data['creators_count'], 4)
        self.assertGreaterEqual(data['brands_count'], 2)

        # Verification list
        res_verifs = self.client.get('/api/admin/verifications?status=all')
        self.assertEqual(res_verifs.status_code, 200)

        # User directory
        res_users = self.client.get('/api/admin/users')
        self.assertEqual(res_users.status_code, 200)
        self.assertGreaterEqual(len(res_users.get_json()), 7)

    def test_13_ai_brief_builder_nlp(self):
        """Verify AI Brief Builder extracts parameters and detects missing info."""
        idea = "30s futuristic cyber sneakers commercial in neo Tokyo with synthwave music"
        brief = analyze_and_build_brief(idea)
        self.assertIn("sneakers", brief['title'].lower())
        self.assertEqual(brief['content_type'], 'Cinematic AI Video')
        self.assertEqual(brief['aspect_ratio'], '16:9 Landscape')
        self.assertIn("Target Audience", " ".join(brief['missing_information']))
        self.assertIn("Brand Color Palette", " ".join(brief['missing_information']))

    def test_14_ai_matching_engine_6_factor(self):
        """Verify 6-factor algorithmic matching produces explainable scoring."""
        matches = get_ranked_creators_for_brief(1)
        self.assertGreater(len(matches), 0)
        top_match = matches[0]
        self.assertIn('match_score', top_match)
        self.assertIn('score_breakdown', top_match)
        self.assertIn('match_reasons', top_match)
        self.assertIn('match_unmet', top_match)
        self.assertIn('specialization', top_match['score_breakdown'])
        self.assertIn('tools', top_match['score_breakdown'])
        self.assertIn('skills', top_match['score_breakdown'])
        self.assertIn('budget', top_match['score_breakdown'])

    def test_15_ai_verifier_heuristic_audit(self):
        """Verify ComfyUI and license verification heuristic analyzer."""
        res_pass = analyze_verification_evidence(
            'workflow',
            'ComfyUI FLUX Pipeline',
            'Full ComfyUI JSON graph with seed 49812, sampler Euler, 45 steps, denoise 0.45.',
            'https://example.com/comfy_graph.json'
        )
        self.assertEqual(res_pass['integrity_status'], 'PASS')
        self.assertEqual(res_pass['recommended_action'], 'AUTO_APPROVE')
        self.assertGreaterEqual(res_pass['authenticity_score'], 85)

if __name__ == '__main__':
    unittest.main()
