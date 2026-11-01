#!/usr/bin/env bash
# Records real command output for Learn mode. Usage: bash sandbox/record.sh ubuntu|alma
# Recorded on linux/amd64, like most servers. Each command runs in its own fresh container, so no recording depends on another.
set -euo pipefail
cd "$(dirname "$0")"
case "$1" in
  ubuntu) image=ubuntu:24.04; distro='Ubuntu 24.04'; install='apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq' ;;
  alma) image=almalinux:10; distro='AlmaLinux 10'; install='dnf install -y -q' ;;
  *) echo "usage: $0 ubuntu|alma" >&2; exit 2 ;;
esac
list="record/$1.txt"
packages=$(sed -n 's/^# packages: //p' "$list")
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
grep -v '^#' "$list" | grep . > "$out/cmds.tsv"
docker run --rm --privileged --platform linux/amd64 -v "$out":/out "$image" bash -c "
  $install $packages >/dev/null 2>&1
  useradd -m user 2>/dev/null; cd /home/user
  while IFS=\$'\t' read -r id cmd; do (cd /home/user && bash -c \"\$cmd\") >/out/\$id.out 2>&1 || true; done </out/cmds.tsv"
node record-merge.js "$distro" "$out"
