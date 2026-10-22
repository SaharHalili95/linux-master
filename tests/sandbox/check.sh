#!/usr/bin/env bash
# Runs every stage 3-8 answer, right and wrong, on Ubuntu 24.04 in Docker and checks the results.
set -euo pipefail
cd "$(dirname "$0")/.."
node serve.js 8766 >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null' EXIT
sleep 1
node dump.js
python3 sandbox/make_run.py data.json > sandbox/run.sh
docker run --rm -v "$PWD/sandbox":/s ubuntu:24.04 bash -c \
  'apt-get update -qq >/dev/null && apt-get install -y -qq binutils procps file git nmap xxd >/dev/null; bash /s/run.sh >/dev/null 2>&1; cp /results.tsv /s/results.tsv'
python3 sandbox/check_results.py data.json sandbox/results.tsv
