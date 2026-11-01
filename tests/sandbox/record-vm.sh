#!/usr/bin/env bash
# Runs a record list (default record/vm.txt) on a throwaway GitHub Actions VM and writes one .out file per line into $1.
set -uo pipefail
cd "$(dirname "$0")"
out=$1; list=${2:-record/vm.txt}; mkdir -p "$out"
sudo apt-get update -qq >/dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $(sed -n 's/^# packages: //p' "$list") >/dev/null
id user >/dev/null 2>&1 || sudo useradd -m user
grep -v '^#' "$list" | grep . > "$out/cmds.tsv"
while IFS=$'\t' read -r id setup cmd; do
  [ -z "$cmd" ] && { cmd=$setup; setup=; }
  d=$(mktemp -d); sudo chown user "$d"
  sudo timeout 60 bash -c "cd $d && $setup" > "$out/$id.setup" 2>&1; sudo timeout 60 bash -c "cd $d && $cmd" > "$out/$id.out" 2>&1 || true
done < "$out/cmds.tsv"
mkdir -p "$out/setup" && mv "$out"/*.setup "$out/setup/" 2>/dev/null
ls "$out" | wc -l
