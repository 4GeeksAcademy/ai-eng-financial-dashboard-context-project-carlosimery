#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f AGENTS.md || ! -d agents/rules ]]; then
  printf 'Run from the repository root: bash agents/check-rules.sh\n' >&2
  exit 1
fi

failures=0
count=0
for rule in agents/rules/*.md; do
  [[ -f "$rule" ]] || continue
  count=$((count + 1))
  for section in Nombre Alcance Justificacion Guia Verificacion; do
    if ! grep -Fqx "## $section" "$rule"; then
      printf 'Missing section: %s -> %s\n' "$rule" "$section" >&2
      failures=$((failures + 1))
    fi
  done
  evidence=0
  while IFS= read -r link; do
    evidence=$((evidence + 1))
    target="${link#](}"
    target="${target%)}"
    target="${target%%#*}"
    if [[ ! -f "agents/rules/$target" ]]; then
      printf 'Broken evidence link: %s -> %s\n' "$rule" "$target" >&2
      failures=$((failures + 1))
    fi
  done < <(grep -oE '\]\(\.\.?/[^)]+\)' "$rule" || true)
  if [[ "$evidence" -eq 0 ]]; then
    printf 'Missing repository evidence link: %s\n' "$rule" >&2
    failures=$((failures + 1))
  fi
done

if ! grep -Fq '`./agents/rules`' AGENTS.md; then
  printf 'AGENTS.md does not reference ./agents/rules\n' >&2
  failures=$((failures + 1))
fi

printf 'Rule files: %s; validation failures: %s\n' "$count" "$failures"
[[ "$count" -gt 0 && "$failures" -eq 0 ]]