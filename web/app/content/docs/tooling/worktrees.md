# Git Worktrees

Git worktrees let you work on multiple feature branches simultaneously in separate folders, each with its own isolated environment.

---

## Starting a Feature (Two-Phase Workflow)

The `implement-feature` skill uses a two-phase workflow. This is because worktrees are created **outside** the VS Code workspace, and Claude Code's auto-accept and project permissions only apply to files **inside** the workspace.

### Phase 1: Setup (from main window)

In your main VS Code window (`Training-App`), run:

```
/implement-feature my-feature-name
```

This automatically:
- Creates a new git worktree and branch at `../Training-App-my-feature-name`
- Copies `.claude`, `.env`, and Supabase link config files
- Installs dependencies with `pnpm install`
- Generates TypeScript types
- Opens the worktree in a **new VS Code window**
- **Stops** — does not start implementing

### Phase 2: Implementation (from new window)

In the newly opened VS Code window (the worktree), open Claude Code and run:

```
/implement-feature my-feature-name
```

The same skill detects it's running inside a worktree and skips setup — it goes straight to reading the spec and implementing the feature. Since the worktree is now the workspace root, auto-accept and all permissions work normally.

### Why Two Phases?

VS Code's workspace root doesn't change when Claude Code runs `cd` in the terminal. If Phase 1 tried to implement directly, it would write files to a directory outside its workspace — causing permission prompts on every file creation, even with auto-accept enabled. Opening the worktree as its own VS Code window solves this.

---

## Migration Timestamp Conflicts

If any two branches create new migrations at the same time — worktree + main, or two worktrees — they may get the same timestamp, causing a filename conflict when merging.

When this happens, rename the conflicting files to a later timestamp before merging:

```bash
mv supabase/migrations/20260228130000_add_feature.sql \
   supabase/migrations/20260228150000_add_feature.sql
```

Supabase runs migrations in alphabetical filename order, so timestamps just need to be **unique** — the exact time does not matter.

If main adds new migrations after your worktree was created and those get pushed to the remote Supabase DB, your worktree's `db push` will fail. Fix it by copying the missing migration files from main into the worktree:

```bash
cp ../Training-App/supabase/migrations/20260228130000_add_something.sql \
   supabase/migrations/
```

---

## Pushing to Main — Correct Order

Always `git pull` before `git push` on main. This ensures you pick up any worktree PRs that merged while you were working, keeping history linear and avoiding ugly "Merge branch 'main' of..." commits.

```bash
git pull origin main
git push origin main
```

You can push main changes to GitHub freely at any time as long as you pull first. Worktree branches being active or pushed to GitHub does not block you — only a merged PR changes remote main.

---

## Cleaning Up

```bash
# From the main repo root
git worktree remove ../Training-App-my-feature

# Delete the branch
git branch -d feature/my-feature
```
