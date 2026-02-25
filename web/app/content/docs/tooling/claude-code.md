# Claude Code

This project uses [Claude Code](https://claude.com/claude-code) as the primary AI coding assistant. This guide covers how the project is configured for Claude Code and practical tips for using it effectively.

---

## Project Configuration

### CLAUDE.md Files

Claude Code reads `CLAUDE.md` files to understand project conventions and rules. This project has three:

- `CLAUDE.md` — Root — shared rules (monorepo structure, Supabase migration rules)
- `mobile/CLAUDE.md` — Mobile-specific rules (NativeWind, AppText, AnimatedButton, etc.)
- `web/CLAUDE.md` — Web-specific rules (architecture, page-padding, input components, etc.)

Claude Code automatically loads the relevant `CLAUDE.md` based on which files you're working with. The root file is always loaded.

### What the Rules Cover

- **Styling** — Which component libraries and patterns to use (NativeWind for mobile, Tailwind for web)
- **Components** — Required components like `AppText`, `AnimatedButton`, input components from `ui/`
- **Imports** — Always use absolute paths, never relative
- **TypeScript** — Never use `any` type
- **Translations** — Always add translations for user-facing text
- **Architecture** — Where to put pages, features, database queries, and shared code

### Persistent Memory

Claude Code also maintains a memory file at `~/.claude/projects/c--dev-Training-App/memory/MEMORY.md`. This stores lessons learned across sessions — things like migration filename formats, critical safety rules, and debugging insights. Claude Code reads this automatically at the start of every conversation.

---

## Critical Safety Rules

### Never Run `npx expo prebuild --clean`

This project has extensive custom native Kotlin code in `android/` — step counter, alarm, timer, and battery modules. The `--clean` flag deletes the entire `android/` directory and regenerates it from scratch, **destroying all custom native code**.

If native config changes are needed, manually edit `AndroidManifest.xml` or use Expo config plugins. For building, always use:

```bash
npx expo run:android
```

### Never Use `CREATE OR REPLACE FUNCTION` in Migrations

See the [Migrations](/admin/docs/backend/migrations) documentation for details. Always `DROP FUNCTION` first, then `CREATE FUNCTION`.

### Migration Filename Format

Always use the full `YYYYMMDDHHmmss` timestamp format for migration filenames:

```bash
# Correct
20260223200000_add_feature.sql

# Wrong — causes ordering conflicts
20260223_add_feature.sql
```

---

## Common Workflows

### Starting a Task

When asking Claude Code to make changes, it will automatically:

1. Read the relevant `CLAUDE.md` file(s)
2. Explore the codebase to understand existing patterns
3. Plan the implementation if the task is non-trivial
4. Make changes following the project conventions

For larger tasks, Claude Code enters **plan mode** where it presents an implementation plan before writing code. You can approve, modify, or reject the plan.

### Useful Commands

```bash
# Start Claude Code
claude

# Resume the last conversation
claude --continue

# Resume and provide a prompt
claude --continue "now add tests for it"

# Run in the mobile directory for mobile-specific work
cd mobile && claude
```

### Slash Commands

- `/commit` — Create a git commit with an auto-generated message
- `/help` — Show available commands
- `/clear` — Clear conversation context

### Implementing Features from Specs

Write a spec file in `specs/` describing the feature, then in Claude Code type:

```
/implement-feature snooze-normal-notifications
```

Claude Code will read the skill file, replace the arguments with `snooze-normal-notifications`, and start executing the instructions — reading the spec, planning, and implementing with sub-agents.

For any other feature, same pattern:

```
/implement-feature some-other-feature
```

> **Note:** Do not use a `project:` prefix — just `/implement-feature`. The skill must be defined in `.claude/skills/` within the current working directory.

### Subagents

Claude Code has built-in subagents you can invoke by typing `@agent` in the prompt:

- **Bash** — Run terminal commands (git, npm, etc.)
- **Explore** — Fast codebase search and exploration
- **Plan** — Design implementation plans before coding
- **general-purpose** — Multi-step research and complex tasks

Multiple agents can be launched in parallel for independent tasks.

### Best Practices Review

After implementing a feature from `specs/`, Claude Code automatically scans the changed code against best practices reference guides. This is configured as a rule in each app's `CLAUDE.md`.

The reference guides live in `.agents/skills/` and cover:

- **Mobile** — React Native performance (FPS, TTI, bundle size, memory, animations) and data patterns (TanStack Query, re-renders, async)
- **Web** — Vercel React best practices (async waterfalls, bundle size, server-side perf, re-renders, rendering, JS performance)

You can also trigger a scan manually at any time:

```
/apply-best-practices recent
/apply-best-practices features/timer/
/apply-best-practices app/feed/page.tsx
```

---

## Tips

### Be Specific About Scope

Tell Claude Code which app you're working on:

- *"In the mobile app, add a new button to the settings page"*
- *"In the web app, update the feed card component"*

### Use Specs for Larger Features

For larger features, write a spec file in `mobile/specs/` or `web/specs/` describing what you want. Then ask Claude Code to implement it. This gives it clear requirements to work from.

### Finnish Translations

When adding user-facing text, always remind Claude Code to add both English and Finnish translations. It knows to use proper ä/ö characters in Finnish — never substituting with plain a/o.

### React Native Specifics

- Use `nanoid/non-secure` instead of `nanoid` — Hermes doesn't have `crypto`
- Rebuild with `npx expo run:android` after any native code changes (no hot reload for Kotlin)
- Never use inline `style` props — always use NativeWind `className`
