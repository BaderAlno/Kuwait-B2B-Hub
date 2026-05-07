import json
import re
import os

def get_keys(data, prefix=''):
    keys = set()
    if isinstance(data, dict):
        for k, v in data.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.update(get_keys(v, new_prefix))
            else:
                keys.add(new_prefix)
    return keys

en = json.load(open('messages/en.json'))
ar = json.load(open('messages/ar.json'))
en_keys = get_keys(en)
ar_keys = get_keys(ar)

missing = []

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            content = open(path).read()
            
            # Find const tVar = useTranslations('namespace')
            hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(['\"]([^'\"]+)['\"]\)", content)
            
            for t_var, ns in hooks:
                # Find tVar('key')
                calls = re.findall(fr"{t_var}\((['\"])([^'\"]+)\1", content)
                for _, key in calls:
                    full_key = f"{ns}.{key}"
                    if full_key not in en_keys or full_key not in ar_keys:
                        missing.append({"file": path, "key": full_key, "en": full_key in en_keys, "ar": full_key in ar_keys})

# Deduplicate
unique_missing = {}
for m in missing:
    k = m['key']
    if k not in unique_missing:
        unique_missing[k] = m

print(json.dumps(list(unique_missing.values()), indent=2))
