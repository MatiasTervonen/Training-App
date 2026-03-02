# Git Worktrees

Git worktrees let you work on multiple feature branches simultaneously in separate folders, each with its own isolated environment.

---

## Starting a Feature

Use the `implement-feature` skill to start a new feature in a worktree:

```
/implement-feature my-feature-name
```

This automatically:
- Creates a new git worktree and branch at `../Training-App-my-feature-name`
- Copies `.env` files
- Copies the Supabase link config so `db push` works immediately
- Installs dependencies with `pnpm install`
- Generates TypeScript types
- Opens the worktree in a new VSCode window

You develop and test in the worktree just like any normal branch — run the app, push migrations, iterate.

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
