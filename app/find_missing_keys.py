import json
import re
import os

def get_keys(data, prefix=""):
    keys = set()
    if isinstance(data, dict):
        for k, v in data.items():
            full_key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.update(get_keys(v, full_key))
            else:
                keys.add(full_key)
    return keys

with open('messages/en.json', 'r') as f:
    en_data = json.load(f)
    en_keys = get_keys(en_data)

with open('messages/ar.json', 'r') as f:
    ar_data = json.load(f)
    ar_keys = get_keys(ar_data)

missing = {}

with open('all_files.txt', 'r') as f:
    files = f.read().splitlines()

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
        
        # Find const tVar = useTranslations('ns')
        # Matches: const t = useTranslations('nav');
        # Matches: const tCommon = useTranslations('common');
        namespaces = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(['\"]([^'\"]+)['\"]\)", content)
        
        for t_var, ns in namespaces:
            # Find tVar('key') or tVar("key")
            calls = re.findall(fr"{t_var}\((['\"])([^'\"]+)\1", content)
            for _, key in calls:
                full_key = f"{ns}.{key}"
                if full_key not in en_keys or full_key not in ar_keys:
                    if full_key not in missing:
                        missing[full_key] = {"files": [], "in_en": full_key in en_keys, "in_ar": full_key in ar_keys}
                    if file_path not in missing[full_key]["files"]:
                        missing[full_key]["files"].append(file_path)

# Handle useTranslations() without namespace (absolute keys)
absolute_hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(\)", content)
for t_var in absolute_hooks:
    calls = re.findall(fr"{t_var}\((['\"])([^'\"]+)\1", content)
    for _, key in calls:
        if key not in en_keys or key not in ar_keys:
            if key not in missing:
                missing[key] = {"files": [], "in_en": key in en_keys, "in_ar": key in ar_keys}
            if file_path not in missing[key]["files"]:
                missing[key]["files"].append(file_path)

print(json.dumps(missing, indent=2))
