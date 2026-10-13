"""
CreatorVerse AI - Package & ZIP Archive Generator (final5 Release)
Creates final5 unzipped folder and final5.zip archive on the User's Desktop
and in the project root directory.
"""

import os
import zipfile
import shutil

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DESKTOP_DIR = os.path.expanduser("~/Desktop")

EXCLUDE_DIRS = {'__pycache__', '.git', '.vscode', '.idea'}
EXCLUDE_EXTS = {'.pyc', '.pyo'}

def copy_folder_contents(src, dst):
    print(f"[*] Copying unzipped project directory to: {dst}")
    if os.path.exists(dst):
        shutil.rmtree(dst, ignore_errors=True)
    os.makedirs(dst, exist_ok=True)
    
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel = os.path.relpath(root, src)
        dest_root = os.path.join(dst, rel) if rel != '.' else dst
        os.makedirs(dest_root, exist_ok=True)
        
        for file in files:
            if file.endswith('.zip') or any(file.endswith(ext) for ext in EXCLUDE_EXTS):
                continue
            src_f = os.path.join(root, file)
            dst_f = os.path.join(dest_root, file)
            shutil.copy2(src_f, dst_f)
    print(f"[OK] Unzipped directory created at {dst}")

def create_zip(target_zip_path):
    print(f"[*] Packaging archive: {target_zip_path}")
    os.makedirs(os.path.dirname(target_zip_path), exist_ok=True)
    
    with zipfile.ZipFile(target_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_DIR):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file.endswith('.zip') or any(file.endswith(ext) for ext in EXCLUDE_EXTS):
                    continue
                    
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_DIR)
                zipf.write(full_path, rel_path)
                
    size_mb = os.path.getsize(target_zip_path) / (1024 * 1024)
    print(f"[OK] Successfully generated {target_zip_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    # Run test suite to refresh verification if needed
    os.system(f'python3 "{os.path.join(PROJECT_DIR, "test_giri.py")}"')
    
    # Target folders and archives for fin and FINAL releases
    desktop_fin_dir = os.path.join(DESKTOP_DIR, "fin")
    desktop_fin_zip = os.path.join(DESKTOP_DIR, "fin.zip")
    local_fin_zip = os.path.join(PROJECT_DIR, "fin.zip")

    desktop_final_dir = os.path.join(DESKTOP_DIR, "FINAL")
    desktop_final_zip = os.path.join(DESKTOP_DIR, "FINAL.zip")
    local_final_zip = os.path.join(PROJECT_DIR, "FINAL.zip")
    
    # Generate unzipped folders on Desktop
    copy_folder_contents(PROJECT_DIR, desktop_fin_dir)
    copy_folder_contents(PROJECT_DIR, desktop_final_dir)
    
    # Generate zip archive on Desktop
    create_zip(desktop_fin_zip)
    
    # Mirror copies to FINAL.zip and local archives
    shutil.copy2(desktop_fin_zip, desktop_final_zip)
    shutil.copy2(desktop_fin_zip, local_fin_zip)
    shutil.copy2(desktop_fin_zip, local_final_zip)
    
    print("\n=======================================================")
    print(" ALL FIXED DELIVERABLES READY ON DESKTOP!")
    print(f" 1. fin.zip (Requested):   {desktop_fin_zip}")
    print(f" 2. fin unzipped folder:   {desktop_fin_dir}")
    print(f" 3. FINAL.zip:             {desktop_final_zip}")
    print(f" 4. FINAL unzipped folder: {desktop_final_dir}")
    print("=======================================================")
