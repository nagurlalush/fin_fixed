import re
import os
import glob

base_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(base_dir, "templates", "index.html")
js_dir = os.path.join(base_dir, "static", "js")
app_path = os.path.join(base_dir, "app.py")

with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# 1. Parse all HTML IDs
html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_content))

# 2. Parse all buttons in HTML
button_matches = re.findall(r'<button\b[^>]*>(.*?)</button>', html_content, re.DOTALL | re.IGNORECASE)
print(f"Total <button> elements in index.html: {len(button_matches)}")

# 3. Check openModal calls in HTML and JS
html_open_modals = re.findall(r'openModal\(["\']([^"\']+)["\']\)', html_content)
html_close_modals = re.findall(r'closeModal\(["\']([^"\']+)["\']\)', html_content)

# Collect all JS code
js_files = glob.glob(os.path.join(js_dir, "*.js"))
js_all_code = ""
js_contents = {}
for jf in js_files:
    fname = os.path.basename(jf)
    with open(jf, "r", encoding="utf-8") as f:
        c = f.read()
    js_contents[fname] = c
    js_all_code += "\n" + c

js_open_modals = re.findall(r'openModal\(["\']([^"\']+)["\']\)', js_all_code)
js_close_modals = re.findall(r'closeModal\(["\']([^"\']+)["\']\)', js_all_code)

all_modals_opened = set(html_open_modals + js_open_modals)
all_modals_closed = set(html_close_modals + js_close_modals)

print("\n--- MODAL CHECKS ---")
for m in sorted(all_modals_opened):
    if m not in html_ids:
        print(f"  [ERROR] openModal('{m}') called but ID '{m}' does NOT exist in index.html!")
    else:
        print(f"  [OK] openModal('{m}') exists.")

# 4. Check navigateTo calls in HTML and JS
html_nav = re.findall(r'navigateTo\(["\']([^"\']+)["\']\)', html_content)
js_nav = re.findall(r'navigateTo\(["\']([^"\']+)["\']\)', js_all_code)
all_navs = set(html_nav + js_nav)

print("\n--- NAVIGATION CHECKS ---")
for n in sorted(all_navs):
    view_id = f"view-{n}"
    if view_id not in html_ids:
        print(f"  [ERROR] navigateTo('{n}') called but ID '{view_id}' does NOT exist in index.html!")
    else:
        print(f"  [OK] navigateTo('{n}') -> ID '{view_id}' exists.")

# 5. Check all onclick/onsubmit/onchange in HTML
handlers = re.findall(r'(onclick|onsubmit|onchange)=["\']([^"\']+)["\']', html_content)
print(f"\nTotal inline event handlers in HTML: {len(handlers)}")

# Collect JS defined functions
js_funcs = set()
for fname, c in js_contents.items():
    f1 = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', c)
    f2 = re.findall(r'(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)', c)
    f3 = re.findall(r'(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*async\s*(?:function|\([^)]*\)\s*=>)', c)
    js_funcs.update(f1)
    js_funcs.update(f2)
    js_funcs.update(f3)

builtins = {'event', 'alert', 'confirm', 'console', 'parseInt', 'parseFloat', 'encodeURIComponent', 'scroll', 'scrollTo', 'click', 'focus'}

missing_html_handlers = []
for attr, code in handlers:
    funcs_called = re.findall(r'([a-zA-Z0-9_]+)\s*\(', code)
    for fc in funcs_called:
        if fc not in js_funcs and fc not in builtins and not hasattr(object, fc):
            if fc not in ('getElementById', 'querySelector', 'querySelectorAll', 'preventDefault', 'stopPropagation', 'reset'):
                missing_html_handlers.append((attr, fc, code))

if missing_html_handlers:
    print("\n--- [ERROR] UNRESOLVED INLINE HANDLERS IN HTML ---")
    for attr, fc, code in missing_html_handlers:
        print(f"  {attr}: function '{fc}' NOT defined in JS! Code: {code}")
else:
    print("\n--- [OK] ALL INLINE HANDLERS IN HTML ARE RESOLVED IN JS ---")

# 6. Check getElementById in all JS files
print("\n--- CHECKING document.getElementById IN ALL JS FILES ---")
for fname, c in js_contents.items():
    get_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', c)
    for gid in sorted(set(get_ids)):
        # If not dynamically formed
        if not any(ch in gid for ch in ['$', '{', '}', '+', '`']):
            if gid not in html_ids:
                print(f"  [{fname}] ID NOT FOUND IN HTML: '{gid}'")

# 7. Check all fetch calls against app.py
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

app_routes = set(re.findall(r'@app\.route\(["\']([^"\']+)["\']', app_code))
print(f"\n--- CHECKING ALL JS FETCH CALLS AGAINST FLASK ROUTES ({len(app_routes)} routes) ---")
for fname, c in js_contents.items():
    fetches = re.findall(r'fetch\(["\']([^"\']+)["\']', c)
    fetches += re.findall(r'fetch\(`([^`]+)`', c)
    for f_url in sorted(set(fetches)):
        # clean query string
        clean_url = f_url.split("?")[0]
        # test regex pattern
        clean_pattern = "^" + re.sub(r'\$\{[^}]+\}', '[^/]+', clean_url) + "$"
        matched = False
        for ar in app_routes:
            flask_pattern = "^" + re.sub(r'<[^>]+>', '[^/]+', ar) + "$"
            # test dummy substitution
            test_url = re.sub(r'\$\{[^}]+\}', '123', clean_url)
            if re.match(flask_pattern, test_url):
                matched = True
                break
        if not matched:
            print(f"  [{fname}] UNMATCHED FETCH: {f_url}")

print("\nAudit completed successfully.")
