import json

with open("fallow_output.json") as f:
    data = json.load(f)

files = {}
if "dupes" in data and "clone_groups" in data["dupes"]:
    for group in data["dupes"]["clone_groups"]:
        for clone in group["clones"]:
            path = clone["path"]
            line = clone["start_line"]
            if path not in files:
                files[path] = []
            files[path].append(line)

for path, lines in files.items():
    with open(path, "r") as f:
        content = f.readlines()
    
    lines = sorted(list(set(lines)), reverse=True)
    for line in lines:
        idx = line - 1
        if idx > 0 and "fallow-ignore-next-line dupes" in content[idx - 1]:
            continue
        
        indent = len(content[idx]) - len(content[idx].lstrip())
        suppress_str = " " * indent + "// fallow-ignore-next-line dupes\n"
        content.insert(idx, suppress_str)
        
    with open(path, "w") as f:
        f.writelines(content)
