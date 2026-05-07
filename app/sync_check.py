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

# Load JSONs
en_path = 'messages/en.json'
ar_path = 'messages/ar.json'

with open(en_path, 'r') as f:
    en_json = json.load(f)
    en_keys = get_keys(en_json)

with open(ar_path, 'r') as f:
    ar_json = json.load(f)
    ar_keys = get_keys(ar_json)

# Regex to find: const t = useTranslations('namespace')
hook_re = re.compile(r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)")
# Regex to find: t('key')
call_re = re.compile(r"(\w+)\(\s*['\"]([^'\"]+)['\"]\s*")

missing = {}

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                
                # Find var to namespace mapping
                var_to_ns = {}
                for m in hook_re.finditer(content):
                    var_to_ns[m.group(1)] = m.group(2)
                
                # Find all potential t calls
                for m in call_re.finditer(content):
                    var_name = m.group(1)
                    key = m.group(2)
                    
                    if var_name in var_to_ns:
                        ns = var_to_ns[var_name]
                        full_key = f"{ns}.{key}"
                        
                        if full_key not in en_keys or full_key not in ar_keys:
                            if full_key not in missing:
                                missing[full_key] = {
                                    'en': full_key in en_keys,
                                    'ar': full_key in ar_keys,
                                    'files': set()
                                }
                            missing[full_key]['files'].add(path)

# Convert sets to lists for JSON output
for k in missing:
    missing[k]['files'] = list(missing[k]['files'])

print(json.dumps(missing, indent=2))
