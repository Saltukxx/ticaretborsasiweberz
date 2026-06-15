#!/bin/bash
set -euo pipefail

BOARDS=(
  "684be8dd43fdfcdc3a431da1:yonetim_kurulu"
  "680c9aca950a44d145ac33ad:meclis"
  "684be97d43fdfcdc3a431dc1:tobb_delegeleri"
  "684be22bf6f8419e31262ebd:personel"
)

for entry in "${BOARDS[@]}"; do
  id="${entry%%:*}"
  group="${entry##*:}"
  url="https://www.erzurumtb.org.tr/boards/${id}"
  echo "=== $group ($id) ==="
  html=$(curl -sL --max-time 30 "$url")
  echo "$html" | grep -oE 'src="[^"]+"' | grep -viE 'logo|tobb|akredite|ISO|iqnet|80\.YIL' | head -20
  echo "$html" | grep -oE '"image[^"]*":"[^"]+"' | head -10
  echo "$html" | grep -oE '"photo[^"]*":"[^"]+"' | head -10
  echo "$html" | grep -oE 'uploads/[^"'\'' ]+' | head -10
done

echo "=== danisman ==="
html=$(curl -sL --max-time 30 "https://www.erzurumtb.org.tr/danismanimiz")
echo "$html" | grep -oE 'src="[^"]+"' | grep -viE 'logo|tobb|akredite|ISO|iqnet|80\.YIL' | head -20
