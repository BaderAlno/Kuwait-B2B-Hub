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

def check_json(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return get_keys(data), data

en_keys, en_data = check_json('messages/en.json')
ar_keys, ar_data = check_json('messages/ar.json')

results = []

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                
                # Find all hook initializations: const tName = useTranslations('namespace')
                hook_matches = re.findall(r"const (\w+)\s*=\s*useTranslations\('([^']+)'\)", content)
                
                for t_var, namespace in hook_matches:
                    # Find all calls: t_var('key', ...)
                    # Handle both single quotes and double quotes
                    calls = re.findall(fr"{t_var}\((['\"])([^'\"]+)\1", content)
                    for _, key in calls:
                        full_key = f"{namespace}.{key}"
                        if full_key not in en_keys or full_key not in ar_keys:
                            results.append({
                                "file": path,
                                "namespace": namespace,
                                "key": key,
                                "full_key": full_key,
                                "in_en": full_key in en_keys,
                                "in_ar": full_key in ar_keys
                            })

# Special case for raw() calls if any
raw_calls = re.findall(r"\.raw\((['\"])([^'\"]+)\1", content)
# (This part is harder because it might not be prefixed with the namespace if it's t.raw)

# Deduplicate
unique_results = {}
for r in results:
    if r['full_key'] not in unique_results:
        unique_results[r['full_key']] = r

print(json.dumps(list(unique_results.values()), indent=2))
