import sqlite3
import json
import os
from werkzeug.security import generate_password_hash
from database import init_db, get_db

def seed():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing data for fresh seed
    tables = [
        'notifications', 'verification_records', 'project_comments', 'deliverables',
        'project_commercial_terms', 'project_milestones', 'projects', 'invitations',
        'shortlists', 'creative_briefs', 'portfolio_items', 'brand_profiles',
        'creator_profiles', 'users'
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")

    # Reset SQLite autoincrement sequence
    cursor.execute("DELETE FROM sqlite_sequence")

    print("[SEED] Inserting users...")
    users_data = [
        (1, "Rajesh Kumar (Platform Admin)", "admin@creatorverse.ai", "admin123", "admin",
         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
         "Platform administrator, trust & safety reviewer, and verification validator.",
         "Master Verifier & Platform Admin", "Bengaluru, India"),

        (2, "Aarav Sharma", "aarav@creatorverse.ai", "creator123", "creator",
         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
         "Award-winning AI Director & Visual Futurist specializing in cinematic commercials, custom ComfyUI node pipelines, and hyper-realistic narrative filmmaking.",
         "Senior AI Cinematographer & ComfyUI Specialist", "Mumbai, India"),

        (3, "Vikram Malhotra", "vikram@creatorverse.ai", "creator123", "creator",
         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
         "Pioneering 3D generative motion designer leveraging Kling AI, Runway Gen-3, and custom LoRA models for high-impact kinetic campaigns and luxury aesthetics.",
         "3D Generative Motion Designer & VFX Artist", "Bengaluru, India"),

        (4, "Priya Sengupta", "priya@creatorverse.ai", "creator123", "creator",
         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
         "Specialist in Midjourney v6 and Flux.1 Pro photorealism, virtual fashion avatars, editorial spreads, and brand consistency systems.",
         "Generative Fashion Stylist & Character Designer", "New Delhi, India"),

        (5, "Kabir Reddy", "kabir@creatorverse.ai", "creator123", "creator",
         "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
         "Multimedia artist focusing on rapid social-first video generation, Topaz upscaling, and synthetic sound design with ElevenLabs.",
         "Viral AI Content Creator & Audio-Visual Synthesist", "Hyderabad, India"),

        (6, "Apex Media Studios", "apex@brands.com", "brand123", "brand",
         "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
         "Global creative agency producing high-impact digital commercials and generative campaigns for Fortune 500 tech and consumer brands.",
         "Creative Production & Innovation Agency", "Mumbai, India"),

        (7, "Lumina Creative Hub", "lumina@brands.com", "brand123", "brand",
         "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80",
         "International haute couture brand leading the frontier of synthetic virtual fashion runways and digital flagship experiences.",
         "Luxury Fashion & Digital Apparel House", "Bengaluru, India")
    ]

    for u in users_data:
        pwd_hash = generate_password_hash(u[3])
        cursor.execute('''
            INSERT INTO users (id, name, email, password_hash, role, avatar, bio, headline, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (u[0], u[1], u[2], pwd_hash, u[4], u[5], u[6], u[7], u[8]))

    print("[SEED] Inserting creator profiles...")
    creator_profiles_data = [
        (1, 2, "AI Cinematography & Video",
         json.dumps(["Cinematography", "Prompt Engineering", "Color Grading", "LoRA Fine-Tuning", "ComfyUI Architecture"]),
         json.dumps(["Runway Gen-3", "Flux.1 Pro", "ComfyUI", "Topaz Video AI", "DaVinci Resolve Studio"]),
         json.dumps(["Cinematic Video Commercials", "Brand Teasers", "Photorealistic Stills", "Motion Posters"]),
         json.dumps(["16:9", "9:16", "2.39:1 Anamorphic"]),
         950, 2500, "Available Now",
         "100% Commercial Clearance Guaranteed. Custom synthetic pipelines with no copyright training contamination. Fully licensed tool seats.",
         "English, Hindi", "verified", 4.98, 28),

        (2, 3, "3D Motion & Kinetic VFX",
         json.dumps(["3D Animation", "Kinetic Typography", "Camera Projection", "VFX Compositing", "Physics Simulation"]),
         json.dumps(["Kling AI", "Runway Gen-3", "Blender", "After Effects", "Cinema 4D"]),
         json.dumps(["3D Motion Commercials", "Product Reveals", "Logo Intros", "Kinetic Loops"]),
         json.dumps(["16:9", "9:16", "1:1"]),
         800, 1800, "Available Now",
         "Commercial advertising clearance across digital, DOOH, and broadcast. Full commercial IP ownership transfer upon delivery.",
         "English, Hindi, Kannada", "verified", 4.92, 19),

        (3, 4, "Fashion & Virtual Avatars",
         json.dumps(["Virtual Model Consistency", "Fashion Styling", "Character Design", "High-End Retouching"]),
         json.dumps(["Midjourney v6", "Flux.1 Pro", "Photoshop Beta", "Magnific AI"]),
         json.dumps(["Editorial Lookbooks", "Virtual Influencer Stills", "Fashion Film Teasers"]),
         json.dumps(["4:5", "9:16", "1:1"]),
         700, 1500, "Part-Time",
         "Full commercial rights for fashion lookbooks and print advertising. Model likeness releases provided.",
         "English, Hindi, Bengali", "submitted", 4.87, 14),

        (4, 5, "Viral Social & Audio-Visuals",
         json.dumps(["Short-Form Video", "Audio Synthesis", "Meme Direction", "Dynamic Editing"]),
         json.dumps(["Kling AI", "Luma Dream Machine", "ElevenLabs", "CapCut Pro", "Topaz Video AI"]),
         json.dumps(["TikTok / Reels Campaigns", "Social Video Ads", "Synthetic Voiceovers"]),
         json.dumps(["9:16", "1:1"]),
         450, 800, "Available Now",
         "Commercial social media rights included for online channels.",
         "English, Hindi, Telugu", "unverified", 4.75, 9)
    ]

    for cp in creator_profiles_data:
        cursor.execute('''
            INSERT INTO creator_profiles (
                id, user_id, specialization, skills, tools_models, content_types,
                aspect_ratios, day_rate, min_budget, availability, commercial_rights_capabilities,
                languages, verified_status, rating, completed_projects_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', cp)

    print("[SEED] Inserting brand profiles...")
    brand_profiles_data = [
        (1, 6, "Apex Media Studios", "Advertising & Entertainment", "https://apexmediastudios.com",
         "producer@apexmediastudios.com", "+1 (310) 555-0199",
         "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
         "Leading international creative agency producing high-concept commercials for next-gen consumer brands and game publishers.",
         "100 Innovation Way, Suite 400, San Francisco, CA 94107"),

        (2, 7, "Lumina Fashion Global", "Luxury Fashion & Retail", "https://luminafashion.paris",
         "creative@luminafashion.paris", "+33 1 42 68 55 00",
         "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=150&q=80",
         "Paris-based luxury couture label redefining runway storytelling through synthetic virtual models and spatial fashion films.",
         "12 Rue du Faubourg Saint-Honoré, 75008 Paris, France")
    ]

    for bp in brand_profiles_data:
        cursor.execute('''
            INSERT INTO brand_profiles (
                id, user_id, company_name, industry, website, contact_email, contact_phone, logo, description, company_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', bp)

    print("[SEED] Inserting portfolio items...")
    portfolio_data = [
        # Aarav Sharma (Creator 1: AI Cinematography & Video) - 4 Items (2 MP4, 2 JPG)
        (1, 1, "Chronos X — Luxury Timepiece Cinema Commercial",
         "A 4K photorealistic commercial cut featuring surreal macro chronometry, obsidian liquid motion, and cinematic anamorphic lens flares.",
         "Commercial Video", "video",
         "/static/uploads/chronos_x_master.mp4",
         "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Runway Gen-3", "Flux.1 Pro", "ComfyUI", "Topaz Video AI"]),
         "Multi-stage ComfyUI workflow utilizing custom LoRA trained on Swiss watch mechanisms, passed to Runway Gen-3 with camera motion tracking.",
         "16:9", "4K UHD (3840x2160)",
         "Cinematic macro shot of luxury black titanium watch gears, sapphire crystal reflections, dark moody lighting, 8k resolution, photorealistic",
         "Reference CAD models, 12 lighting study renders",
         "Full perpetual commercial usage rights transfer for global broadcast and digital DOOH."),

        (2, 1, "Neon Odyssey — Cyberpunk Electric Hypercar Spec",
         "High-speed automotive commercial through a rain-drenched futuristic megacity with dynamic tracking shots and volumetric lighting.",
         "Commercial Video", "video",
         "/static/uploads/neon_odyssey_car.mp4",
         "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
         json.dumps(["ComfyUI", "Runway Gen-3", "DaVinci Resolve Studio"]),
         "Frame-by-frame depth map guidance and ControlNet lineart pass locked to 3D vehicle chassis model, rendered at 60fps via Topaz.",
         "16:9", "4K UHD (3840x2160)",
         "Sleek electric hypercar driving through neon rainy Tokyo streets, reflections on wet asphalt, volumetric cyan and magenta lights, high speed action camera",
         "Storyboard animatic, 3D wireframe proxy",
         "Commercial rights cleared for automotive brand campaigns and social media channels."),

        (3, 1, "Neo-Varanasi 2099 — Anamorphic Cinematic Stills",
         "Ultra-wide 21:9 concept stills depicting futuristic solar ghats, floating atmospheric barges, and dense cyberpunk architectural density.",
         "Concept Art Stills", "image",
         "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Midjourney v6.1", "Flux.1 Dev", "Photoshop AI"]),
         "High-precision anamorphic prompting blended with depth-guided matte painting and manual atmospheric color grading.",
         "21:9", "8K Ultra-Wide (7680x3291)",
         "Cinematic anamorphic pan shot of futuristic holy riverfront megacity, neon holographic lanterns reflecting on holy water, dusk haze, 35mm panavision lens",
         "Layered PSD with depth passes, 8 lighting variations",
         "Worldwide commercial publication rights across print, digital, and OOH."),

        (4, 1, "Aetheria Flight — Sci-Fi Keyframe Matte Painting",
         "Photorealistic cinematic key visual capturing supersonic orbital shuttles piercing cloud layers over the Himalayas.",
         "Key Visual Stills", "image",
         "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Flux.1 Pro", "ComfyUI", "Magnific AI"]),
         "Latent upscaling with custom atmospheric scattering LoRA and edge-preserving bilateral denoising filter.",
         "16:9", "8K UHD (7680x4320)",
         "Hyper-detailed orbital transport ship banking over snowcapped Himalayan peaks at golden hour, vapor contrails, cinematic volumetric lighting, 8k",
         "High-res raw TIFF exports, alpha channel matte passes",
         "Full commercial advertising buyout and game splash usage."),

        # Vikram Malhotra (Creator 2: 3D Motion & Procedural Art) - 4 Items (2 MP4, 2 JPG)
        (5, 2, "Metamorphosis — Kinetic 3D Liquid Gold Identity",
         "Hypnotic kinetic 3D motion study of morphing liquid gold alloys synchronized to organic percussive rhythms.",
         "3D Motion", "video",
         "/static/uploads/sample_render.mp4",
         "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Kling AI", "Blender", "Cinema 4D"]),
         "Blender fluid simulation baked to alembic cache, then style-transferred using Kling AI video-to-video with custom gold shader LoRA.",
         "16:9", "4K UHD (3840x2160)",
         "Viscous fluid liquid gold morphing into sculptural typographic forms, glossy surface reflections, studio lighting, 4k",
         "Alembic point cloud cache, audio beat stems",
         "Full commercial advertising rights transfer for broadcast, digital, and retail displays."),

        (6, 2, "Quantum Zero — Kinetic Brand Reveal Loop",
         "Seamless kinetic brand reveal featuring floating crystalline geometric structures and reactive particle emissions.",
         "3D Motion", "video",
         "/static/uploads/volt_zero_v1_1.mp4",
         "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Kling AI", "Runway Gen-3", "After Effects"]),
         "Hybrid procedural Blender particle system driven by noise fields, stylized through Runway Gen-3 with tight color space clamping.",
         "9:16", "2160x3840 Vertical 4K",
         "Floating crystalline geometric sculpture breaking apart into glowing particles, pure obsidian background, futuristic luxury logo reveal",
         "Particle simulation cache",
         "Commercial social media and DOOH advertising rights."),

        (7, 2, "Obsidian Monolith — Brutalist 3D Architectural Stills",
         "Monumental architectural design studies exploring stark obsidian monolithic geometry, raw titanium surfaces, and desert shadows.",
         "3D Architectural Stills", "image",
         "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Blender", "ComfyUI (ControlNet)", "Flux.1 Dev"]),
         "ControlNet normal and depth map passes generated from procedural Blender geometry, refined through Flux.1 with PBR material realism.",
         "16:9", "8K UHD (7680x4320)",
         "Monumental brutalist architectural structure made of black matte stone and dark glass in an arid desert landscape, architectural photography, sharp midday sun",
         "Blender .blend scene, OpenEXR multilayer renders",
         "Commercial rights cleared for real-estate and luxury branding."),

        (8, 2, "Hyper-Prism — Procedural Glass Refraction Study",
         "High-detail generative studies examining light dispersion, caustics, and chromatic aberration through complex geometric crystal prisms.",
         "Generative Art Stills", "image",
         "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Cinema 4D", "Octane AI", "Magnific AI"]),
         "Octane spectral dispersion bake piped through neural diffusion detail enhancer, maintaining accurate physical index of refraction.",
         "1:1", "4096x4096 Square Master",
         "Macro abstract crystal prism splitting beam of pure light into vivid rainbow caustics, glossy dark backdrop, studio macro photography",
         "Normal passes, spectral LUT profiles",
         "Commercial rights cleared for product packaging and digital music covers."),

        # Priya Sengupta (Creator 3: Virtual Fashion & Lookbooks) - 4 Items (1 MP4, 3 JPG)
        (9, 3, "Ethereal Couture — Fall/Winter Haute Couture Spread",
         "Hyper-realistic editorial fashion spread featuring synthetic avatar models adorned in bio-luminescent textile gowns.",
         "Fashion Editorial", "image",
         "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Midjourney v6", "Flux.1 Pro", "Magnific AI"]),
         "Custom Midjourney character consistency seeds blended with Flux.1 Pro texture pass and Magnific AI 8K detail resolution boost.",
         "4:5", "8K Ultra-Res (5760x7200)",
         "High fashion model wearing intricate bio-luminescent gown woven from optic fibers, minimalist concrete architectural runway, Vogue editorial lighting",
         "Fabric moodboard, 20 high-res texture crops",
         "Editorial and print commercial clearance with digital usage rights worldwide."),

        (10, 3, "Nebula Runway — Virtual Paris Fashion Week Film",
         "A 30-second virtual fashion runway cinematic showcasing flowing iridescent silk dresses in a misty architectural pavilion.",
         "Fashion Runway Film", "video",
         "/static/uploads/volt_zero_v1_0.mp4",
         "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Runway Gen-3", "Midjourney v6", "ComfyUI"]),
         "IP-Adapter garment transfer applied over 3D walking rig motion sequence, rendered with temporal consistency clamping.",
         "16:9", "4K UHD (3840x2160)",
         "Virtual runway model striding through architectural fog pavilion, gossamer silk gown flowing with realistic cloth dynamics, Paris fashion week lighting",
         "Cloth simulation cache, model turnaround sheet",
         "Commercial global digital runway and brand website usage rights."),

        (11, 3, "Synthetic Muse — Virtual Model Portrait Lookbook",
         "Stunning photorealistic beauty portrait series highlighting pore-level facial fidelity, micro-textures, and high-fashion styling.",
         "Model Portrait Stills", "image",
         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Flux.1 Pro", "ComfyUI FaceID", "Photoshop Retouch"]),
         "FaceID identity locking coupled with custom dermis sub-surface scattering LoRA for unblemished photorealistic skin fidelity.",
         "4:5", "5000x6250 Editorial Portrait",
         "Editorial close-up beauty portrait of striking South Asian model, subtle golden hour rim light, high-fashion makeup, natural skin texture, 85mm f/1.4 lens",
         "Identity seed sheet, color-graded raw files",
         "Full commercial advertising clearance for beauty and cosmetics brands."),

        (12, 3, "Bio-Silk Textures — Luminescent Macro Fabric Series",
         "Ultra-macro study of futuristic bio-engineered textiles with micro-optical fibers, gold threading, and tactile weave structures.",
         "Textile Concept Stills", "image",
         "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Midjourney v6.1", "Magnific AI", "Substance 3D"]),
         "Macro lens prompting cross-referenced with PBR normal maps to achieve tactile micro-surface accuracy.",
         "1:1", "4096x4096 Seamless Texture",
         "Extreme macro photography of futuristic haute couture fabric, woven silk with embedded micro-gold conductive circuits, soft studio lighting",
         "Seamless tileable texture maps, height & roughness passes",
         "Commercial textile manufacturing and digital luxury rights."),

        # Kabir Reddy (Creator 4: Social VFX & Generative Audio) - 4 Items (2 MP4, 2 JPG)
        (13, 4, "Zero-G Soundwaves — Kinetic Sonic Video",
         "Dynamic 9:16 vertical video reel highlighting reactive sonic liquid spheres dancing to electronic synth rhythms.",
         "Social Video", "video",
         "/static/uploads/sample_render.mp4",
         "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Kling AI", "ElevenLabs", "Topaz Video AI"]),
         "Audio stem spectral analysis keyed into Kling motion rate, enhanced through Topaz Video AI 60fps interpolation.",
         "9:16", "1080x1920 Full HD",
         "Sound reactive liquid chrome bubbles floating in anti-gravity, pulsing to heavy bass, iridescent holographic reflections",
         "Audio stem WAV, timeline edit",
         "Commercial digital rights for TikTok, Instagram Reels, and YouTube Shorts."),

        (14, 4, "Volt Surge — 15s High-Energy Social Commercial",
         "Rapid-fire commercial cutdown featuring kinetic speed ramping, electric particle sparks, and viral motion hooks.",
         "Social Ad Cut", "video",
         "/static/uploads/volt_zero_v1_0.mp4",
         "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Runway Gen-3", "CapCut Pro", "Topaz Video AI"]),
         "Aggressive optical flow speed ramp transitions synchronized with synthesized audio drops, color boosted for mobile screens.",
         "9:16", "1080x1920 Vertical 60fps",
         "Fast-paced kinetic energy drink commercial, neon cyan sparks erupting as can cracks open, high-speed camera motion, intense bass drop",
         "Master project file, audio mixdown stems",
         "Perpetual commercial rights for mobile and paid social ad campaigns."),

        (15, 4, "Sonic Flora — Generative Audio-Visual Key Art",
         "Vibrant botanical artwork infused with bioluminescent synth-wave flora, designed for music album covers and digital posters.",
         "Key Visual Poster", "image",
         "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Flux.1 Dev", "Midjourney v6", "Photoshop"]),
         "Soundwave envelope data mapped into latent guidance parameters, generating music-reactive organic visual symmetry.",
         "1:1", "4000x4000 High-Res",
         "Bioluminescent exotic floral arrangement glowing with vivid cyan and purple neon energy, dark obsidian background, sharp hyper-detailed petals",
         "High-res print-ready CMYK and RGB files",
         "Commercial rights cleared for streaming artwork, vinyl covers, and tour merch."),

        (16, 4, "Cyber-Typography — Streetwear Key Visual Poster",
         "High-impact streetwear graphic poster featuring generative typography, distorted glitch elements, and bold industrial layout.",
         "Brand Graphic Poster", "image",
         "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1400&q=80",
         "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80",
         json.dumps(["Midjourney v6", "Illustrator", "Photoshop"]),
         "Glitch-diffusion synthesis layered with precision vector typography and halftone risograph screen textures.",
         "4:5", "4000x5000 Poster Master",
         "Avant-garde streetwear graphic poster, Japanese brutalist typography, vibrant chromatic aberration, glitch artifacts, urban aesthetics",
         "Layered AI and vector source files",
         "Full commercial apparel and advertising rights.")
    ]

    for p in portfolio_data:
        cursor.execute('''
            INSERT INTO portfolio_items (
                id, creator_id, title, description, category, media_type, media_url,
                thumbnail_url, tools_used, workflow_description, aspect_ratio, resolution,
                prompt_summary, intermediate_assets, commercial_rights
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', p)

    print("[SEED] Inserting creative briefs...")
    briefs_data = [
        (1, 1, "Hyper-Energy Cyberpunk Soda Launch Campaign",
         "Architect a heart-pounding 30-second commercial video and 3 vertical social cutdowns launching 'Volt Zero' — an electric citrus beverage targeted at gamers and gen-z futurists.",
         "Gen-Z & Millennial Gamers (Ages 18-32)",
         "Commercial Video Campaign",
         "Cyberpunk aesthetic with rainy neon street reflections, hyper-kinetic camera glides, and crystalline condensation close-ups.",
         "16:9", "4K UHD (3840x2160)", "30s Master Cut + 3x 10s Social Shorts",
         json.dumps(["Broadcast Television", "YouTube Pre-Roll", "Instagram Reels", "TikTok", "Digital Billboards (DOOH)"]),
         json.dumps(["1x 30s Master 4K Video (16:9)", "3x 10s Vertical Cutdowns (9:16)", "5x High-Res 4K Promo Key Visuals", "Raw ComfyUI Node Graph & Seed Manifest"]),
         4000, 7500, "2026-11-15",
         json.dumps(["Cinematography", "Color Grading", "LoRA Fine-Tuning", "VFX Compositing"]),
         json.dumps(["Runway Gen-3", "Flux.1 Pro", "ComfyUI", "Topaz Video AI"]),
         "Full Commercial Buyout (Perpetual Broadcast, Digital & DOOH)",
         "Worldwide", "Perpetual Commercial Use",
         "Brand colors must strictly adhere to hex #00FFCC (Electric Cyan) and #FF0055 (Neon Magenta). Zero AI hallmarked copyright artifacts.",
         "published"),

        (2, 2, "Haute Couture Virtual Lookbook & Runway Film",
         "Produce an ethereal 60-second virtual fashion film and 12-look editorial stills spread for Lumina's Fall/Winter 'Nebula' collection.",
         "High-Fashion Enthusiasts, Luxury Buyers & Editorial Press",
         "Virtual Fashion Film & Lookbook",
         "Surreal brutalist architecture in mist, monochromatic silk drapery with micro-fiber luminescence, hyper-realistic avatar models.",
         "16:9", "4K UHD (3840x2160)", "60s Runway Film + 12 Stills",
         json.dumps(["Official Website", "Paris Fashion Week Digital Pavilion", "Vogue / Harper's Bazaar Digital", "Instagram"]),
         json.dumps(["1x 60s 4K Virtual Runway Film", "12x 8K Photorealistic Editorial Stills", "Model Consistency LoRA Weights Archive"]),
         5000, 9000, "2026-11-20",
         json.dumps(["Virtual Model Consistency", "Fashion Styling", "High-End Retouching", "Cinematography"]),
         json.dumps(["Midjourney v6", "Flux.1 Pro", "Runway Gen-3", "Magnific AI"]),
         "Exclusive Luxury Editorial & Digital Commercial License",
         "Worldwide", "3 Years Commercial Rights",
         "Facial symmetry and garment stitching must maintain photorealistic fidelity. Complete model likeness release contracts provided.",
         "published"),

        (3, 1, "Next-Gen Spatial Computing Headset Teaser",
         "Craft a sleek 45-second teaser reveal video for a revolutionary holographic spatial visor, featuring floating volumetric UI interfaces and futuristic product ergonomics.",
         "Early Tech Adopters, Enterprise Developers & Designers",
         "Product Teaser Commercial",
         "Minimalist Apple-esque studio lighting with dark titanium textures, iridescent holographic glass, and kinetic particle trails.",
         "16:9", "4K UHD (3840x2160)", "45s Teaser Cut",
         json.dumps(["Keynote Livestream", "Tech Crunch / Verge Ads", "LinkedIn", "YouTube 4K"]),
         json.dumps(["1x 45s Master Teaser Cut (16:9)", "Raw 3D Depth Map Passes", "Sound Design Stems"]),
         3500, 6000, "2026-11-25",
         json.dumps(["3D Animation", "Kinetic Typography", "Prompt Engineering"]),
         json.dumps(["Kling AI", "Blender", "Runway Gen-3"]),
         "Commercial Digital & Keynote Rights",
         "Worldwide", "Perpetual Commercial Use",
         "Product silhouette must remain true to approved industrial design schematics.",
         "published")
    ]

    for b in briefs_data:
        cursor.execute('''
            INSERT INTO creative_briefs (
                id, brand_id, title, objective, target_audience, content_type, visual_style,
                aspect_ratio, resolution, duration, target_platforms, deliverables, budget_min,
                budget_max, deadline, required_skills, required_tools, commercial_usage_type,
                territory, usage_duration, restrictions, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', b)

    print("[SEED] Inserting shortlists & invitations...")
    cursor.execute("INSERT INTO shortlists (id, brand_id, creator_id) VALUES (1, 1, 1)")
    cursor.execute("INSERT INTO shortlists (id, brand_id, creator_id) VALUES (2, 1, 2)")

    cursor.execute('''
        INSERT INTO invitations (
            id, brief_id, brand_id, creator_id, message, proposed_budget, proposed_deadline, status, response_message
        ) VALUES (
            1, 1, 1, 1,
            'Aarav, your ComfyUI cinematography and color grading pipeline is the exact aesthetic we require for the Volt Zero launch commercial. We would love to collaborate on this engagement.',
            5500, '2026-11-15', 'accepted',
            'Thrilled to collaborate! Ready to deliver 4K master cuts with custom ComfyUI pipelines.'
        )
    ''')

    print("[SEED] Inserting projects, milestones, terms & deliverables...")
    cursor.execute('''
        INSERT INTO projects (
            id, brief_id, brand_id, creator_id, title, agreed_budget, agreed_deadline, status
        ) VALUES (
            1, 1, 1, 1,
            'Volt Zero — Cyberpunk Soda Commercial Production',
            5500, '2026-11-15', 'active'
        )
    ''')

    milestones_data = [
        (1, 1, "Milestone 1: Concept Direction & Seed Locking", "Style frames, color palette hex validation, and character seed approval.", "2026-10-18", "completed", 1),
        (2, 1, "Milestone 2: 30s Rough Cut Assembly (v1.0)", "Complete sequence layout with camera motion glides and scratch audio track.", "2026-10-25", "completed", 2),
        (3, 1, "Milestone 3: 4K Master Video & Social Cutdowns (v1.1)", "Topaz 4K UHD upscale, audio mastering, and color pass delivery.", "2026-11-05", "completed", 3),
        (4, 1, "Milestone 4: Final Sign-off & Commercial IP Transfer", "Delivery of raw ComfyUI node graphs, seeds, ProRes 422 HQ masters, and IP clearance signature.", "2026-11-15", "pending", 4)
    ]

    for m in milestones_data:
        cursor.execute('''
            INSERT INTO project_milestones (id, project_id, title, description, due_date, status, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', m)

    cursor.execute('''
        INSERT INTO project_commercial_terms (
            id, project_id, usage_type, territory, duration, restrictions
        ) VALUES (
            1, 1,
            'Perpetual Global Commercial Advertising (DOOH, Broadcast, Digital Paid Ads)',
            'Worldwide',
            'Perpetual Commercial Use',
            'Commercial clearance granted. Brand logo and trademark protection guaranteed.'
        )
    ''')

    deliverables_data = [
        (1, 1, "v1.0", "Volt Zero Rough Assembly Cut",
         "Initial 30s sequence cut with sound effects and camera motion glides.",
         "/static/uploads/volt_zero_v1_0.mp4",
         "video", "16:9", "1080p FHD (1920x1080)", "85 MB", "revision_requested",
         "Pacing on the opening can reveal is excellent. At 0:14, the motion blur on the logo is slightly heavy. Please sharpen the condensation droplets and increase neon reflection intensity.",
         "0:14 - Logo motion blur pass; 0:22 - Condensation macro"),

        (2, 1, "v1.1", "Volt Zero 4K Master Cut with Refined Color Pass",
         "Refined 4K render addressing client feedback: logo sharpness locked at 0:14, enhanced droplet highlights, and full dynamic range color grade.",
         "/static/uploads/volt_zero_v1_1.mp4",
         "video", "16:9", "4K UHD (3840x2160)", "245 MB", "approved",
         "Approved! Outstanding work on the logo clarity and droplet highlights. Ready for final milestone execution.",
         None)
    ]

    for d in deliverables_data:
        cursor.execute('''
            INSERT INTO deliverables (
                id, project_id, version, title, description, file_url, media_type,
                aspect_ratio, resolution, file_size, status, revision_notes, revision_timecodes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', d)

    comments_data = [
        (1, 1, 6, "Aarav, excited to kick off the Volt Zero campaign! Pacing is crucial for this gaming audience.", None),
        (2, 1, 2, "Thanks Apex team! I have custom ComfyUI nodes ready for the condensation droplets and lighting. First cut will be ready ahead of schedule.", None),
        (3, 1, 6, "v1.1 cut looks sensational! That fix on 0:14 logo motion blur was spot on. Approving this version now.", None)
    ]

    for c in comments_data:
        cursor.execute('''
            INSERT INTO project_comments (id, project_id, user_id, comment_text, attachment_url)
            VALUES (?, ?, ?, ?, ?)
        ''', c)

    print("[SEED] Inserting verification records...")
    verifications_data = [
        (1, 1,
         "Runway Unlimited Enterprise Receipt #RNW-88412; Midjourney Pro active subscription; Local dual RTX 4090 ComfyUI station logs.",
         "Custom ComfyUI workflow json with custom node group for LoRA weight scheduling and IP-Adapter character locking.",
         "Raw 4K uncompressed exports and seed logs for Chronos X campaign.",
         "Full evidence submitted with video walkthrough.",
         "approved", 1,
         "Confirmed. Enterprise tooling verified, ComfyUI node setup shows expert-level control, full rights confirmed.",
         "2026-09-15 14:30:00"),

        (2, 2,
         "Kling AI Pro Team license; Blender 4.1 commercial license; Luma Dream Machine commercial account.",
         "Blender viewport capture demonstrating bounding-box 3D camera tracker paired with Kling video-to-video workflow.",
         "Project file archive containing original depth map passes and audio stems.",
         "Evidence reviewed and approved.",
         "approved", 1,
         "Verified high technical proficiency in 3D-guided generative AI video.",
         "2026-09-20 11:15:00"),

        (3, 3,
         "Midjourney Pro Subscription receipt #MJ-991203; Flux.1 Pro API token invoices via Replicate.",
         "Prompt sequences showing multi-prompt character consistency across 12 unique angles with consistent seed.",
         "High-resolution contact sheet with 50+ iterations leading to final editorial lookbook.",
         "Submitted for platform verification to earn Verified Creator badge.",
         "pending", None, None, None)
    ]

    for v in verifications_data:
        cursor.execute('''
            INSERT INTO verification_records (
                id, creator_id, tool_evidence, workflow_evidence, past_work_evidence,
                notes, status, reviewer_id, reviewer_notes, reviewed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', v)

    print("[SEED] Inserting notifications...")
    notifications_data = [
        (1, 2, "Deliverable Approved!", "Apex Media Studios approved Volt Zero v1.1 Master Cut.", "approval", "#workspace"),
        (2, 2, "New Project Assigned", "You have been assigned to Volt Zero Commercial.", "project", "#workspace"),
        (3, 6, "New Deliverable Uploaded", "Aarav Sharma uploaded Volt Zero v1.1 (4K UHD).", "deliverable", "#workspace")
    ]

    for n in notifications_data:
        cursor.execute('''
            INSERT INTO notifications (id, user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', n)

    conn.commit()
    conn.close()
    print("=========================================================")
    print(" CreatorVerse AI Database seeded successfully with demo data!")
    print(" Pre-seeded accounts ready:")
    print(" - Creator: aarav@creatorverse.ai / creator123")
    print(" - Brand:   apex@brands.com / brand123")
    print(" - Admin:   admin@creatorverse.ai / admin123")
    print("=========================================================")

if __name__ == '__main__':
    seed()
