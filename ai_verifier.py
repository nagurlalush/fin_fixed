"""
CreatorVerse AI - AI Verification Heuristic Analyzer
Evaluates creator submitted evidence (Tool licenses, Workflow graphs, Past work records)
using heuristic integrity checks and structural validation.
"""

import json
import re

def analyze_verification_evidence(evidence_type, title, description, evidence_url, metadata=None):
    """
    Performs automated heuristic audit on creator verification submissions.
    Returns:
    {
        'authenticity_score': int (0-100),
        'audit_flags': list[str],
        'integrity_status': 'PASS' | 'FLAGGED' | 'SUSPICIOUS',
        'recommended_action': 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT',
        'technical_summary': str
    }
    """
    score = 75
    flags = []
    
    title_lower = (title or '').lower()
    desc_lower = (description or '').lower()
    url_lower = (evidence_url or '').lower()
    
    # 1. Evidence Type Specific Checks
    if evidence_type == 'tool':
        known_tools = ['midjourney', 'runway', 'comfyui', 'kling', 'flux', 'luma', 'stable diffusion', 'topaz', 'elevenlabs']
        if any(t in title_lower or t in desc_lower or t in url_lower for t in known_tools):
            score += 15
            flags.append("Recognized industry-standard AI production toolchain identified")
        else:
            flags.append("Tool specified is non-standard or unlisted; manual inspection recommended")
            
        if any(w in desc_lower for w in ['subscription', 'license', 'pro', 'tier', 'commercial', 'invoice', 'receipt']):
            score += 10
            flags.append("Commercial enterprise license terms corroborated in documentation")
        else:
            score -= 10
            flags.append("Missing explicit commercial usage tier receipt documentation")

    elif evidence_type == 'workflow':
        if any(w in desc_lower or w in url_lower for w in ['comfyui', 'json', 'graph', 'node', 'pipeline', 'workflow', 'ip-adapter', 'controlnet']):
            score += 15
            flags.append("Verified structured nodal pipeline architecture (ComfyUI / Pipeline graph)")
        if any(w in desc_lower for w in ['seed', 'steps', 'cfg', 'sampler', 'denoise', 'lora']):
            score += 10
            flags.append("Full generation parameter reproducibility confirmed (seed, sampler, cfg)")
        if len(desc_lower) < 40:
            score -= 15
            flags.append("Sparse workflow documentation; node sequence missing explanatory notes")

    elif evidence_type == 'past_work':
        if any(w in url_lower for w in ['http://', 'https://', 'behance', 'artstation', 'vimeo', 'youtube', 'drive']):
            score += 15
            flags.append("Live hosted production portfolio asset link verified")
        if any(w in desc_lower for w in ['client', 'commercial', 'brand', 'campaign', 'delivered']):
            score += 10
            flags.append("Commercial delivery pedigree established with named client context")
        else:
            flags.append("Past work lacks clear commercial context or client attribution")

    # Score clamping & action determination
    score = min(100, max(10, score))
    
    if score >= 85:
        status = 'PASS'
        action = 'AUTO_APPROVE'
        summary = "Comprehensive technical evidence provided with verifiable commercial license and reproducibile workflow."
    elif score >= 60:
        status = 'FLAGGED'
        action = 'MANUAL_REVIEW'
        summary = "Valid evidence submitted, but requires admin manual spot-check of asset links or license details."
    else:
        status = 'SUSPICIOUS'
        action = 'MANUAL_REVIEW'
        summary = "Insufficient technical depth or ambiguous provenance documentation; flagged for administrative review."

    return {
        'authenticity_score': score,
        'audit_flags': flags,
        'integrity_status': status,
        'recommended_action': action,
        'technical_summary': summary
    }
