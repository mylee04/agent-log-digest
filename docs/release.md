# Release Checklist

## Local Verification

Run these commands before tagging:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Run CLI smoke checks:

```bash
node dist/cli.js --json --always-zero -- node test/fixtures/commands/fail-tsc-like.mjs
node dist/cli.js parse test/fixtures/eslint-json.log --tool eslint --json
node dist/cli.js doctor --json
```

## npm Trusted Publishing

The publish workflow uses npm trusted publishing through GitHub Actions OIDC. Configure npm package settings with:

- provider: GitHub Actions
- repository owner: `mylee04`
- repository name: `agent-log-digest`
- workflow filename: `publish-npm.yml`
- environment name: leave blank
- allowed action: `npm publish`

The workflow uses a GitHub-hosted Ubuntu runner, grants `id-token: write`, installs npm `>=11.5.1` on Node `22.14.0`, and publishes with provenance.

## Publish

1. Update `package.json` version.
2. Commit the release changes.
3. Create a GitHub release for the tag.
4. Confirm `.github/workflows/publish-npm.yml` completes successfully.
5. Verify the package page and `npm view agent-log-digest version`.
