"""Rebuild the public skill ZIP, or check it against the project skill in CI."""
import argparse
from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[1]
skill = root / ".agents/skills/alexwjj-liquid-glass"
output = root / "public/downloads" / (skill.name + ".zip")
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
files = [skill / "SKILL.md", *sorted((skill / "assets").glob("*"))]
entries = {str(p.relative_to(skill.parent).as_posix()): p.read_bytes()
           for p in files if p.is_file() and not p.name.startswith(".")}
if args.check:
    with ZipFile(output) as archive:
        if sorted(archive.namelist()) != sorted(entries) or any(
            archive.read(name) != data for name, data in entries.items()
        ):
            raise SystemExit("Rebuild with python3 scripts/package-glass-skill.py")
else:
    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        for name, data in entries.items():
            info = ZipInfo(name)
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compress_type=ZIP_DEFLATED)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(buffer.getvalue())
