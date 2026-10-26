# curio
Welcome to Curio!

I&rsquo;ve always been an avid reader, and most of my education has come from the Internet. For a long time, I&rsquo;ve used read-it-later apps to keep track of what I&rsquo;ve read and highlight the most memorable parts. I built Curio as a passion project to make my reading experience even better, and I&rsquo;m excited to share it with you.

Curio provides a distraction-free reading experience for your favorite articles and newsletters across the web.
Save content from pages when you&rsquo;re on the go, and read it later in a beautiful, focused environment.
Add highlights, notes, and labels to organize your information diet.
Best of all, Curio is open-source, and its essential features will always be free for everyone to use:
- Saving articles from webpages
- Subscribing to email newsletters
- Adding notes, highlights, and labels to saved pages
- Searching over your article library

To get started using Curio, you can use the hosted app at [curi.ooo](https://curi.ooo) and read our [docs](https://curi.ooo/docs).

<p align="middle">
  <img src="https://github.com/skyline-apps/curio/blob/main/src/app/public/assets/curio_inbox.png" alt="Curio inbox" width="400"/>
  <img src="https://github.com/skyline-apps/curio/blob/main/src/app/public/assets/curio_item.png" alt="Curio article" width="400"/>
</p>

If you want to self-host Curio, you can follow the instructions in [src/README.md](src/README.md).

## Development

### Quick Start
1. **Initialize environment & secrets**:
   ```bash
   npm run env:setup
   ```
2. **Start the local development stack**:
   ```bash
   npm run dev:watch
   ```
   This automatically fills `.env` secrets, derives Supabase JWTs, starts all services with Docker Compose, runs database migrations, seeds the default test user (`testuser@curi.ooo` / `testpassword123`), and syncs edits live into the container.
   - App URL: `http://localhost:3000`
   - Supabase Studio: `http://localhost:8000`

3. **Authenticate & Capture Screenshots with Playwright**:
   From `src/app`:
   ```bash
   npm run auth:login
   npm run screenshot -- --path /home --output screenshots/home.png
   ```

### Running Multiple Instances (Worktrees & Port Offsets)
You can work on multiple branches simultaneously without port or container collisions:
1. Create an isolated git worktree:
   ```bash
   git worktree add -b my-feature .worktrees/my-feature origin/main
   cd .worktrees/my-feature
   ```
2. Start the worktree instance:
   ```bash
   npm run dev:watch
   ```
   Inside linked worktrees, a free port offset (e.g. `+100` -> App on `http://localhost:3100`, Kong on `8100`, Postgres on `5532`, Search on `7800`) is auto-assigned and saved to `<gitCommonDir>/curio-worktree-ports.json`. Containers are automatically namespaced with `curio-<worktree>-` (e.g., `curio-my-feature-app`, `curio-my-feature-db`).

3. Manually assign or reset port offsets:
   ```bash
   npm run ports:assign 100   # Offset all ports by +100
   npm run ports:assign 0     # Reset to default ports
   ```

### Automated Worktree Agent Workflow
For AI agents (Antigravity CLI or Claude Code), you can run:
```bash
$workon-curio <issue-number or task description>
```
This skill creates an isolated worktree, plans QA, starts the local dev instance on an isolated port, drives Playwright manual QA and screenshots, runs tests/linting, opens a PR with embedded screenshots, and cleans up after CI passes.

## Feature requests and bug reports
Feel free to file feature requests and bug reports on [GitHub](https://github.com/skyline-apps/curio/issues) by clicking "New issue".