#!/usr/bin/env bash
# Records real command output for Learn mode. Usage: bash sandbox/record.sh ubuntu|alma
# A line is id<TAB>command, or id<TAB>setup<TAB>command where setup runs first, unrecorded.
# All lines share one container, each in a fresh temporary folder. Recorded on linux/amd64, like most servers.
set -euo pipefail
cd "$(dirname "$0")"
case "$1" in
  ubuntu) image=ubuntu:24.04; distro='Ubuntu 24.04'; install='apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq' ;;
  alma) image=almalinux:10; distro='AlmaLinux 10'; install='dnf install -y -q' ;;
  *) echo "usage: $0 ubuntu|alma" >&2; exit 2 ;;
esac
list="record/$1.txt"
packages=$(sed -n 's/^# packages: //p' "$list")
setup=$(sed -n 's/^# setup: //p' "$list")
after=$(sed -n 's/^# after: //p' "$list")
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
grep -v '^#' "$list" | grep . > "$out/cmds.tsv"
docker run --rm --privileged --platform linux/amd64 -v "$out":/var/tmp/rec "$image" bash -c "
  $setup
  $install $packages >/dev/null 2>&1
  $after
  mandb -q 2>/dev/null || true
  useradd -m user 2>/dev/null; cd /home/user
  while IFS=\$'\t' read -r id setup cmd; do
    [ -z \"\$cmd\" ] && { cmd=\$setup; setup=; }
    d=\$(mktemp -d); chown user \$d; cd \$d
    bash -c \"\$setup\" >/dev/null 2>&1; bash -c \"\$cmd\" >/var/tmp/rec/\$id.out 2>&1 || true
  done </var/tmp/rec/cmds.tsv"
node record-merge.js "$distro" "$out"
