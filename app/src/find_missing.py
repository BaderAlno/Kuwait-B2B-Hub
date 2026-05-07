import json
import re
import os

def get_keys(obj, prefix=''):
    keys = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, dict):
                keys.update(get_keys(v, f"{prefix}{k}."))
            else:
                keys.add(f"{prefix}{k}")
    return keys

with open('../messages/en.json') as f:
    en_keys = get_keys(json.load(f))
with open('../messages/ar.json') as f:
    ar_keys = get_keys(json.load(f))

missing = []

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path) as fobj:
                content = fobj.read()
                # tVar = useTranslations('ns')
                for m in re.finditer(r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)", content):
                    var, ns = m.groups()
                    # tVar('key')
                    for mm in re.finditer(fr"{var}\(\s*['\"]([^'\"]+)['\"]\s*[,)]", content):
                        key = mm.group(1)
                        full = f"{ns}.{key}"
                        if full not in en_keys or full not in ar_keys:
                            missing.append({"full_key": full, "file": path, "en": full in en_keys, "ar": full in ar_keys})

unique = {}
for m in missing:
    if m['full_key'] not in unique:
        unique[m['full_key']] = m

print(json.dumps(list(unique.values()), indent=2))
