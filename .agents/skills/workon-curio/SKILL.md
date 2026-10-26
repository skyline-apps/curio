---
name: workon-curio
description: Use to create a PR against a GitHub issue. Also handles a plain task description passed via $workon-curio. Implements, QAs, opens the PR, and cleans up.
---

# Work on Curio in an isolated worktree

Task input is either a GitHub issue (URL or bare `#<number>`) or a free-text task description supplied with `$workon-curio`. If neither is given, ask what needs to be done.

This workflow is for small, well-defined tasks, not multi-day or ambiguous efforts. Determine the repository root with `git rev-parse --show-toplevel` (referred to below as `<repo>`).

0. If the input is a GitHub issue, fetch it (`gh issue view <number> --json number,title,body`) and use its title/body as the task. Keep the issue number for the branch name and PR body in steps 1 and 7.
1. Create a fresh worktree from the latest `origin/main` before any exploration or edits. Derive a short kebab-case branch name from the task (prefixed with the issue number if there is one, e.g. `1046-fix-thing`), run `git fetch origin main`, then use `git worktree add -b <branch> <repo>/.worktrees/<branch> origin/main`. From then on, work only in that new worktree; never read or modify the primary checkout or sibling worktrees.
2. State a QA plan before changing code. Include the golden path and relevant edge cases. For frontend or risky flows (e.g. data mutations, bookmarks import, highlights, auth), plan manual QA using Playwright with step-by-step descriptions and screenshots.
3. Implement the scoped task, following existing codebase conventions and `.agent/rules/rules.md`. (Remember: source code is in `src/`, with `src/app` for the web app, and pretty much all actions should be run from `src/app`).
4. For runnable frontend or backend changes:
   - Invoke `$run` (or run `npm run dev:watch` / `npm run dev:up` from the repo root or worktree root).
   - In a worktree, ports and container names are auto-assigned an isolated offset (e.g. +100) so multiple local instances can run simultaneously without port conflicts.
   - Run `npx tsx --tsconfig tsconfig.api.json scripts/agentLogin.ts` from `src/app` to authenticate test user and produce `.playwright/auth-state.json`.
   - Execute the QA plan using Playwright, capturing screenshots of affected UI states (e.g. via `npx tsx --tsconfig tsconfig.api.json scripts/captureScreenshot.ts --path <route> --output <path>`).
   - Fix failures and repeat. Skip only if there is genuinely nothing runnable and explain why.
5. Run lint and tests scoped to the changed files before committing:
   - From `src/app`: `npx eslint <changed files>` and `npm test` (or `npx vitest run --no-file-parallelism <changed test files>`).
   - Checked-in tests must always have anonymized data.
6. Stage only relevant files and commit a concise message that describes why the change was made.
7. Push with `git push -u origin <branch>`, then use `gh pr create` to open a PR. If there's a linked issue, include `Fixes #<number>` in the body so GitHub auto-links and closes it on merge. Body is otherwise a summary plus the actual QA/test plan:
   - **Frontend changes**: PRs that impact the frontend must have screenshots attached to the PR description (upload and embed using the technique in the `github-screenshot-upload` skill).
   - **Risky flows**: Include the step-by-step Playwright manual QA descriptions and screenshots in the QA plan.
   - If a resumable Claude, Codex, or Antigravity session command exists for the task, also include it in the PR description. Report the PR URL.
8. Poll `gh pr checks <number>` until CI finishes. Fix and push again on failure. Only once checks are green, remove the disposable local worktree with `git worktree remove <repo>/.worktrees/<branch>` and delete its local branch with `git branch -D <branch>`. Do not merge the PR.

If the task becomes large or ambiguous, pause and ask the user before proceeding.
