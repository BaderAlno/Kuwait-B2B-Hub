import re
import os

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                hooks = re.findall(r"useTranslations\(.*?\)", content)
                if hooks:
                    print(f"File: {path}")
                    for h in hooks:
                        print(f"  Hook: {h}")
                    t_calls = re.findall(r"(\w+)\(['\"][^'\"]+['\"]", content)
                    if t_calls:
                        print(f"  Potential t calls: {t_calls[:10]}")
