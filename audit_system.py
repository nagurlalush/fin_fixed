import re
import os
import glob
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(base_dir, "templates", "index.html")
js_dir = os.path.join(base_dir, "static", "js")
app_path = os.path.join(base_dir, "app.py")

with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# 1. Collect all element IDs in HTML
html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_content))
print(f"Total HTML IDs found: {len(html_ids)}")

# 2. Collect all onclick / onsubmit / onchange in HTML
handlers = re.findall(r'(?:onclick|onsubmit|onchange)=["\']([^"\']+)["\']', html_content)
html_called_funcs = set()
for h in handlers:
    matches = re.findall(r'([a-zA-Z0-9_]+)\s*\(', h)
    for m in matches:
        if m not in ('event', 'alert', 'confirm', 'console', 'parseInt', 'parseFloat', 'encodeURIComponent'):
            html_called_funcs.add(m)
print(f"Total distinct functions called in HTML: {len(html_called_funcs)}")

# 3. Collect all functions in JS files
js_funcs = set()
js_files = glob.glob(os.path.join(js_dir, "*.js"))
js_contents = {}
for jf in js_files:
    fname = os.path.basename(jf)
    with open(jf, "r", encoding="utf-8") as f:
        c = f.read()
    js_contents[fname] = c
    f1 = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', c)
    f2 = re.findall(r'(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)', c)
    f3 = re.findall(r'(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*async\s*(?:function|\([^)]*\)\s*=>)', c)
    js_funcs.update(f1)
    js_funcs.update(f2)
    js_funcs.update(f3)

print(f"Total distinct functions defined in JS: {len(js_funcs)}")

missing_funcs = sorted([f for f in html_called_funcs if f not in js_funcs])
print(f"\n--- MISSING FUNCTIONS CALLED IN HTML ({len(missing_funcs)}) ---")
for mf in missing_funcs:
    print(f"  [MISSING FUNCTION]: {mf}")

# 4. Check getElementById references in JS against HTML IDs
missing_ids = set()
for fname, c in js_contents.items():
    get_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', c)
    for gid in get_ids:
        # Check if ID exists in HTML
        if gid not in html_ids:
            # Some IDs might be dynamically generated (e.g. `card-${id}`), check if static
            if not any(char in gid for char in ['$', '{', '}', '+']):
                missing_ids.add((fname, gid))

print(f"\n--- POTENTIALLY MISSING HTML IDs REFERENCED IN JS ({len(missing_ids)}) ---")
for fname, gid in sorted(missing_ids):
    print(f"  [{fname}] references non-existent ID: '{gid}'")

# 5. Check fetch routes in JS against app.py routes
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

app_routes = set(re.findall(r'@app\.route\(["\']([^"\']+)["\']', app_code))
print(f"\nTotal Flask routes defined in app.py: {len(app_routes)}")

js_fetch_routes = set()
for fname, c in js_contents.items():
    fetches = re.findall(r'fetch\(["\']([^"\']+)["\']', c)
    fetches += re.findall(r'fetch\(`([^`]+)`', c)
    for url in fetches:
        clean_url = url.split("?")[0]
        # Replace template literals ${...} with dummy or wildcards
        clean_url = re.sub(r'\$\{[^}]+\}', '<param>', clean_url)
        js_fetch_routes.add((fname, clean_url, url))

print(f"Total fetch calls in JS: {len(js_fetch_routes)}")

print("\n--- AUDIT OF JS FETCH CALLS ---")
for fname, clean_url, orig_url in sorted(js_fetch_routes):
    # Try to match with app_routes
    # Regex match for Flask routes with <...>
    matched = False
    for ar in app_routes:
        # convert flask route into regex
        pattern = "^" + re.sub(r'<[^>]+>', '[^/]+', ar) + "$"
        test_url = clean_url.replace("<param>", "123")
        if re.match(pattern, test_url):
            matched = True
            break
    if not matched:
        print(f"  [POTENTIAL ROUTE MISMATCH] {fname}: {orig_url}")
