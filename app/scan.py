import json
import re
import os

with open('messages/en.json') as f:
    en = json.load(f)
with open('messages/ar.json') as f:
    ar = json.load(f)

def has_key(data, path):
    parts = path.split('.')
    curr = data
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        else:
            return False
    return True

missing = []

for root, d, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            with open(os.path.join(root, f)) as fobj:
                content = fobj.read()
                
                # Check for tVar = useTranslations('ns')
                for m in re.finditer(r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)", content):
                    var, ns = m.groups()
                    # Check for tVar('key')
                    for mm in re.finditer(fr"{var}\(\s*['\"]([^'\"]+)['\"]\s*[,)]", content):
                        key = mm.group(1)
                        full = f"{ns}.{key}"
                        if not has_key(en, full) or not has_key(ar, full):
                            missing.append({"key": full, "file": os.path.join(root, f)})
                
                # Check for tVar = useTranslations() --- with no NS
                for m in re.finditer(r"const\s+(\w+)\s*=\s*useTranslations\(\s*\)", content):
                    var = mm.group(1)
                    # (In this project, namespaces are mostly specified)

# DEDUPLICATE
unique = {}
for m in missing:
    if m['key'] not in unique: unique[m['key']] = m['file']

for k, f in unique.items():
    print(f"{k} | {f}")
