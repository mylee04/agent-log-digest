# Parser Fixture Scope

## Included

- Next.js text build output with a compile/type failure in `file:line:column` form.
- Vite/Rollup text build output with a module resolution or transform failure in `file:line:column` form.
- Playwright text/list reporter output with failed test title and `file:line:column`.

## Excluded

- Playwright HTML reports.
- Playwright traces, screenshots, and videos.
- Browser automation against report UIs.
- Remote report downloads or network access.
