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

en_keys = get_keys(json.load(open('messages/en.json')))
ar_keys = get_keys(json.load(open('messages/ar.json')))

missing = []

# Broader regex
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            content = open(path).read()
            
            # Find all translations hooks
            hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)", content)
            var_to_ns = {v: ns for v, ns in hooks}
            
            # Find all potential calls t('key')
            calls = re.findall(r"(\w+)\(\s*['\"]([^'\"]+)['\"]\s*[,)]", content)
            for v, k in calls:
                if v in var_to_ns:
                    ns = var_to_ns[v]
                    full_key = f"{ns}.{k}"
                    if full_key not in en_keys or full_key not in ar_keys:
                        missing.append({"file": path, "full_key": full_key, "en": full_key in en_keys, "ar": full_key in ar_keys})

# Also search for useTranslations() without namespace
generic_hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(\s*\)", content)
# (Handle these if found)

# Print unique missing keys
deduplicated = {m['full_key']: m for m in missing}
print(json.dumps(list(deduplicated.values()), indent=2))
