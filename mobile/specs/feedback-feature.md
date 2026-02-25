# Send Feedback / Report a Bug — Feature Spec

## Context
Users need a way to send feedback or report bugs directly from the app. This adds a new menu item that navigates to a feedback form page with title, category, and message fields. Submissions are stored in a new Supabase `feedback` table.

---

## 1. Database Migration

**New file:** `supabase/migrations/20260225_add_feedback_table.sql`

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only insert their own feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 2. Database Function

**New file:** `mobile/database/settings/send-feedback.ts`

- Follows the same pattern as `mobile/database/settings/save-user-profile.ts`
- Gets session, validates auth, inserts into `feedback` table
- Uses `handleError` utility on failure

---

## 3. Translations

**Edit:** `mobile/locales/en/menu.json` — add `"feedback"` section:
```json
"feedback": {
  "title": "Send Feedback",
  "category": "Category",
  "categories": {
    "bug": "Bug Report",
    "feature": "Feature Request",
    "general": "General Feedback"
  },
  "titleLabel": "Title",
  "titlePlaceholder": "Brief summary",
  "messageLabel": "Message",
  "messagePlaceholder": "Describe in detail...",
  "sending": "Sending feedback...",
  "sendSuccess": "Feedback sent! Thank you.",
  "sendError": "Failed to send feedback. Please try again.",
  "emptyTitle": "Please enter a title.",
  "emptyMessage": "Please enter a message."
}
```

**Edit:** `mobile/locales/fi/menu.json` — add equivalent Finnish translations.

**Edit:** both locale files `menu.menu` section — add `"feedback": "Feedback"` / `"feedback": "Palaute"`.

---

## 4. Menu Screen

**Edit:** `mobile/app/menu/index.tsx`

- Import `MessageSquareMore` (or similar) icon from `lucide-react-native`
- Add a new `<LinkButton>` after Settings, before the logout section:
  ```tsx
  <LinkButton label={t("menu.feedback")} href="/menu/feedback">
    <MessageSquareMore color="#f3f4f6" />
  </LinkButton>
  ```

---

## 5. Feedback Page

**New file:** `mobile/app/menu/feedback/index.tsx`

- Wrapped with `ModalPageWrapper` (per CLAUDE.md rules)
- Uses `PageContainer` inside
- Form fields:
  - `SelectInput` for category (bug / feature / general)
  - `AppInput` for title
  - `SubNotesInput` for message (multi-line, auto-expanding)
- `SaveButton` with label overridden to show "Send" text
- `FullScreenLoader` while sending
- Toast notifications for success/error
- Keyboard dismiss on tap outside
- Validation: title and message must be non-empty

---

## 6. Files to Create/Modify

| Action | File |
|--------|------|
| **Create** | `supabase/migrations/20260225_add_feedback_table.sql` |
| **Create** | `mobile/database/settings/send-feedback.ts` |
| **Create** | `mobile/app/menu/feedback/index.tsx` |
| **Edit** | `mobile/locales/en/menu.json` |
| **Edit** | `mobile/locales/fi/menu.json` |
| **Edit** | `mobile/app/menu/index.tsx` |

## 7. Verification
1. Open the app → Menu → verify "Feedback" / "Palaute" button appears
2. Tap it → feedback form page loads with category, title, message fields
3. Submit with empty fields → validation toast errors
4. Fill in all fields and submit → success toast, record appears in `feedback` table
5. Check Supabase: `SELECT * FROM feedback` shows the submitted row with correct user_id
