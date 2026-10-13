"""
CreatorVerse AI - Algorithmic Matching Engine
Calculates multi-factor compatibility scores between Creative Briefs and AI Creators.
Factors:
1. Specialization match (25%)
2. AI Tools & Models match (20%)
3. Skills match (20%)
4. Budget / Pricing match (15%)
5. Verification status match (10%)
6. Availability match (10%)
"""

import json
from database import get_db

def calculate_creator_match(creator, brief):
    """
    Computes compatibility score (0-100) with explainable reasons and unmet criteria.
    `creator` is a dict with creator profile details.
    `brief` is a dict with brief details.
    """
    reasons = []
    unmet = []
    score_breakdown = {}
    
    # 1. Specialization Match (Weight: 25)
    creator_spec = (creator.get('specialization') or '').lower()
    brief_content_type = (brief.get('content_type') or '').lower()
    brief_style = (brief.get('visual_style') or brief.get('style_genre') or '').lower()
    brief_title = (brief.get('title') or '').lower()
    
    spec_score = 0.0
    if creator_spec and (creator_spec in brief_content_type or creator_spec in brief_style or creator_spec in brief_title):
        spec_score = 25.0
        reasons.append(f"Direct specialization match in {creator.get('specialization')}")
    elif any(word in creator_spec for word in brief_content_type.split()) or any(word in creator_spec for word in brief_style.split()):
        spec_score = 18.0
        reasons.append(f"Related domain expertise in {creator.get('specialization')}")
    else:
        spec_score = 8.0
        unmet.append(f"Brief requests {brief.get('content_type') or 'specific domain'}, but creator focuses on {creator.get('specialization') or 'general creative'}")
    score_breakdown['specialization'] = spec_score
    
    # 2. AI Tools & Models Match (Weight: 20)
    creator_tools_raw = creator.get('tools_models') or creator.get('ai_tools_list') or ''
    creator_tools = [t.strip().lower() for t in creator_tools_raw.split(',') if t.strip()]
    
    brief_tools_raw = brief.get('required_tools') or brief.get('target_tools_list') or ''
    brief_tools = [t.strip().lower() for t in brief_tools_raw.split(',') if t.strip()]
    
    tools_score = 0.0
    matched_tools = []
    if brief_tools:
        for bt in brief_tools:
            for ct in creator_tools:
                if bt in ct or ct in bt:
                    matched_tools.append(ct.title())
                    break
        match_ratio = len(matched_tools) / len(brief_tools) if brief_tools else 1.0
        tools_score = min(20.0, match_ratio * 20.0)
        if matched_tools:
            reasons.append(f"Proficient in requested AI toolchains: {', '.join(matched_tools[:3])}")
        if len(matched_tools) < len(brief_tools):
            missing_tools = [bt.title() for bt in brief_tools if not any(bt in ct for ct in creator_tools)]
            if missing_tools:
                unmet.append(f"Lacks certified experience in: {', '.join(missing_tools[:2])}")
    else:
        tools_score = min(20.0, len(creator_tools) * 4.0)
        reasons.append(f"Diverse AI tool stack ({len(creator_tools)} verified models/tools)")
    score_breakdown['tools'] = round(tools_score, 1)

    # 3. Skills Match (Weight: 20)
    creator_skills_raw = creator.get('skills') or creator.get('skills_list') or ''
    creator_skills = [s.strip().lower() for s in creator_skills_raw.split(',') if s.strip()]
    
    brief_skills_raw = brief.get('required_skills') or brief.get('required_skills_list') or ''
    brief_req_skills = [s.strip().lower() for s in brief_skills_raw.split(',') if s.strip()]
    
    skills_score = 0.0
    matched_skills = []
    if brief_req_skills:
        for req in brief_req_skills:
            for cs in creator_skills:
                if req in cs or cs in req:
                    matched_skills.append(cs.title())
                    break
        match_ratio = len(matched_skills) / len(brief_req_skills) if brief_req_skills else 1.0
        skills_score = min(20.0, match_ratio * 20.0)
        if matched_skills:
            reasons.append(f"Matches required skills: {', '.join(matched_skills[:3])}")
        if len(matched_skills) < len(brief_req_skills):
            missing = [s.title() for s in brief_req_skills if not any(s in cs for cs in creator_skills)]
            if missing:
                unmet.append(f"Brief asks for: {', '.join(missing[:2])}")
    else:
        skills_score = min(20.0, len(creator_skills) * 3.5)
        reasons.append(f"Solid production skill baseline ({len(creator_skills)} declared competencies)")
    score_breakdown['skills'] = round(skills_score, 1)

    # 4. Budget / Pricing Match (Weight: 15)
    creator_rate = float(creator.get('day_rate') or 0.0)
    brief_budget = float(brief.get('budget_max') or brief.get('budget') or 0.0)
    est_duration_days = 7
    est_creator_cost = creator_rate * est_duration_days
    
    budget_score = 0.0
    if brief_budget <= 0:
        budget_score = 12.0
    elif est_creator_cost <= brief_budget:
        budget_score = 15.0
        reasons.append(f"Day rate (${creator_rate:,.0f}/day) fits cleanly within campaign budget (${brief_budget:,.0f})")
    elif est_creator_cost <= brief_budget * 1.25:
        budget_score = 9.0
        unmet.append(f"Estimated cost (${est_creator_cost:,.0f}) slightly exceeds planned budget (${brief_budget:,.0f})")
    else:
        budget_score = 4.0
        unmet.append("Pricing rate exceeds campaign budget margin by >25%")
    score_breakdown['budget'] = round(budget_score, 1)

    # 5. Verification Credential Match (Weight: 10)
    is_verified = bool(creator.get('is_verified')) or (creator.get('verified_status') == 'verified')
    verif_score = 10.0 if is_verified else 3.0
    if is_verified:
        reasons.append("Platform-verified AI creator with audited workflow evidence")
    else:
        unmet.append("Unverified portfolio credentials (pending admin audit)")
    score_breakdown['verification'] = verif_score

    # 6. Availability Match (Weight: 10)
    avail_status = (creator.get('availability') or creator.get('availability_status') or 'available').lower()
    if 'available' in avail_status:
        avail_score = 10.0
        reasons.append("Immediately available for incoming brand commissions")
    elif 'limited' in avail_status or 'busy' in avail_status:
        avail_score = 5.0
        unmet.append(f"Current availability is '{avail_status}' (limited bandwidth)")
    else:
        avail_score = 2.0
        unmet.append("Creator is currently unavailable for new projects")
    score_breakdown['availability'] = avail_score

    # Total Score Calculation
    total_score = sum(score_breakdown.values())
    total_score = min(100.0, max(0.0, total_score))
    
    # Commercial Compatibility Check
    commercial_ok = bool(creator.get('commercial_rights_capabilities') or creator.get('commercial_capabilities'))

    return {
        'score': round(total_score, 1),
        'breakdown': score_breakdown,
        'reasons': reasons,
        'unmet': unmet,
        'commercial_compatible': commercial_ok
    }

def get_ranked_creators_for_brief(brief_id):
    """
    Retrieves all active creators, scores them against the given brief,
    and returns a sorted list of creators with match metadata.
    """
    db = get_db()
    try:
        cursor = db.cursor()
        
        # Load brief
        cursor.execute("SELECT * FROM creative_briefs WHERE id = ?", (brief_id,))
        brief = cursor.fetchone()
        if not brief:
            return []
        brief_dict = dict(brief)
        
        # Load creators
        cursor.execute("""
            SELECT u.id, u.name, u.name as full_name, u.email, u.avatar, u.avatar as avatar_url, u.bio as bio,
                   cp.id as profile_id, cp.skills, cp.skills as skills_list,
                   cp.specialization, cp.tools_models, cp.tools_models as ai_tools_list,
                   cp.day_rate, cp.availability, cp.availability as availability_status,
                   cp.commercial_rights_capabilities, cp.commercial_rights_capabilities as commercial_capabilities,
                   cp.verified_status, (cp.verified_status = 'verified') as is_verified,
                   cp.rating, cp.completed_projects_count, cp.completed_projects_count as total_projects_completed
            FROM users u
            JOIN creator_profiles cp ON u.id = cp.user_id
            WHERE u.role = 'creator' AND cp.verified_status = 'verified'
        """)
        creators = [dict(row) for row in cursor.fetchall()]
        
        scored_creators = []
        for c in creators:
            match_info = calculate_creator_match(c, brief_dict)
            c['match_score'] = match_info['score']
            c['match_reasons'] = match_info['reasons']
            c['match_unmet'] = match_info['unmet']
            c['commercial_compatible'] = match_info['commercial_compatible']
            c['score_breakdown'] = match_info['breakdown']
            scored_creators.append(c)
            
        scored_creators.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_creators
    finally:
        try:
            from flask import has_app_context
            if not has_app_context():
                db.close()
        except ImportError:
            db.close()

def calculate_creator_brand_match(creator, brand):
    """
    Computes compatibility score (0-100) between a Creator and a Brand Profile
    when no specific creative brief has been created yet.
    Matches industry, brand bio/vision, verified status, toolchain capability, and rating.
    """
    reasons = []
    unmet = []
    score_breakdown = {}
    
    brand_industry = (brand.get('industry') or '').lower()
    brand_name = (brand.get('company_name') or '').lower()
    creator_spec = (creator.get('specialization') or '').lower()
    creator_tools_raw = (creator.get('tools_models') or creator.get('ai_tools_list') or '').lower()
    creator_skills_raw = (creator.get('skills') or creator.get('skills_list') or '').lower()
    
    # 1. Industry Domain Synergy (Weight: 30)
    ind_score = 15.0
    if ('advertising' in brand_industry or 'entertainment' in brand_industry) and ('video' in creator_spec or 'cinematography' in creator_spec or 'vfx' in creator_spec):
        ind_score = 30.0
        reasons.append(f"Direct domain synergy for {brand.get('industry') or 'Commercial'} production")
    elif ('fashion' in brand_industry or 'retail' in brand_industry) and ('fashion' in creator_spec or 'avatar' in creator_spec or 'lookbook' in creator_skills_raw):
        ind_score = 30.0
        reasons.append(f"Dedicated specialty in {brand.get('industry') or 'Fashion'} aesthetics")
    elif ('tech' in brand_industry or 'game' in brand_industry or 'software' in brand_industry) and ('3d' in creator_spec or 'vfx' in creator_spec or 'neural' in creator_spec):
        ind_score = 30.0
        reasons.append(f"Advanced technical pipeline tailored for {brand.get('industry') or 'Tech'}")
    elif any(term in creator_spec for term in brand_industry.split()) or any(term in creator_skills_raw for term in brand_industry.split()):
        ind_score = 24.0
        reasons.append(f"Complementary skill profile for {brand.get('industry') or 'Commercial Brands'}")
    else:
        ind_score = 18.0
        reasons.append(f"Versatile generative AI production capabilities for enterprise brands")
    score_breakdown['industry_synergy'] = ind_score

    # 2. Production Toolchain Mastery (Weight: 25)
    tools_list = [t.strip() for t in creator_tools_raw.split(',') if t.strip()]
    tool_score = min(25.0, len(tools_list) * 5.0)
    if 'comfyui' in creator_tools_raw or 'runway' in creator_tools_raw or 'flux' in creator_tools_raw or 'midjourney' in creator_tools_raw:
        tool_score = max(tool_score, 22.0)
        reasons.append(f"Mastery in high-fidelity production tools ({', '.join([t.title() for t in tools_list[:3]])})")
    score_breakdown['tools_mastery'] = tool_score

    # 3. Marketplace Reputation & Rating (Weight: 20)
    rating = float(creator.get('rating') or 5.0)
    completed = int(creator.get('completed_projects_count') or creator.get('total_projects_completed') or 0)
    rep_score = min(20.0, (rating / 5.0) * 16.0 + min(4.0, completed * 0.2))
    if rating >= 4.8:
        reasons.append(f"Top-tier reputation: {rating:.1f}★ rating ({completed} completed brand commissions)")
    score_breakdown['reputation'] = round(rep_score, 1)

    # 4. Verified Status & Audit Shield (Weight: 15)
    is_verified = creator.get('verified_status') == 'verified' or creator.get('is_verified')
    if is_verified:
        verif_score = 15.0
        reasons.append("Audited & Verified ComfyUI / Generative AI pipeline")
    else:
        verif_score = 8.0
        unmet.append("Awaiting final administrative verification audit")
    score_breakdown['verification'] = verif_score

    # 5. Availability & Commercial Clearance (Weight: 10)
    avail = (creator.get('availability') or creator.get('availability_status') or '').lower()
    avail_score = 10.0 if 'available' in avail else 6.0
    if 'available' in avail:
        reasons.append("Immediately available for project commissioning")
    score_breakdown['availability'] = avail_score

    total_score = ind_score + tool_score + rep_score + verif_score + avail_score
    total_score = min(99.0, max(50.0, total_score))

    return {
        'score': round(total_score, 1),
        'breakdown': score_breakdown,
        'reasons': reasons,
        'unmet': unmet,
        'commercial_compatible': True
    }

def get_ranked_creators_for_brand(brand_dict):
    """
    Ranks creators against a brand profile based on domain synergy, rating, and toolchains.
    Used when a brand/agency is logged in and does not have a specific creative brief selected.
    """
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute("""
            SELECT u.id, u.name, u.name as full_name, u.email, u.avatar, u.avatar as avatar_url, u.bio as bio,
                   cp.id as profile_id, cp.skills, cp.skills as skills_list,
                   cp.specialization, cp.tools_models, cp.tools_models as ai_tools_list,
                   cp.day_rate, cp.availability, cp.availability as availability_status,
                   cp.commercial_rights_capabilities, cp.commercial_rights_capabilities as commercial_capabilities,
                   cp.verified_status, (cp.verified_status = 'verified') as is_verified,
                   cp.rating, cp.completed_projects_count, cp.completed_projects_count as total_projects_completed
            FROM users u
            JOIN creator_profiles cp ON u.id = cp.user_id
            WHERE u.role = 'creator' AND cp.verified_status = 'verified'
        """)
        creators = [dict(row) for row in cursor.fetchall()]
        for c in creators:
            match_info = calculate_creator_brand_match(c, brand_dict)
            c['match_score'] = match_info['score']
            c['match_reasons'] = match_info['reasons']
            c['match_unmet'] = match_info['unmet']
            c['commercial_compatible'] = match_info['commercial_compatible']
            c['score_breakdown'] = match_info['breakdown']
        creators.sort(key=lambda x: x['match_score'], reverse=True)
        return creators
    finally:
        try:
            from flask import has_app_context
            if not has_app_context():
                db.close()
        except ImportError:
            db.close()

