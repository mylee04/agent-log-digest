# agent-log-digest Agent Notes

## Scope

- Keep runtime behavior local-only.
- Preserve strict TypeScript settings.
- Prefer evidence-driven TDD for every behavior change.
- Redact secrets before formatted output, raw-log writes, and notifications.
- Preserve wrapped command exit codes unless `--always-zero` is explicitly set.
- Do not add telemetry, runtime network calls, postinstall hooks, or automatic fix behavior.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

## Architecture

- `src/cli.ts`: executable entry and command routing.
- `src/cli/parseArgs.ts`: `node:util.parseArgs` option handling.
- `src/run/runWrappedCommand.ts`: safe command wrapper using `spawn` with `shell: false`.
- `src/core/createDigest.ts`: parser orchestration, grouping, ranking, and summary assembly.
- `src/parsers/*`: deterministic parser implementations.
- `src/formatters/*`: JSON, Markdown, and pretty terminal renderers.
