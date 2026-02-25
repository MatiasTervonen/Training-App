# Send Feedback / Report a Bug — Web Feature Spec

## Context
Users need a way to send feedback or report bugs directly from the web app. This adds a new menu item that navigates to a feedback form page with category, title, and message fields. Submissions are stored in the shared Supabase `feedback` table (same table used by the mobile app).

---

## 1. Database Migration

**Already handled** by `supabase/migrations/20260225_add_feedback_table.sql` (created for mobile). The `feedback` table and RLS policies are shared between both apps.

---

## 2. Database Function

**New file:** `web/database/settings/send-feedback.ts`

- Follows the same pattern as `web/database/settings/save-user-profile.ts`
- Uses client-side `createClient()` from `@/utils/supabase/client`
- Gets claims via `supabase.auth.getClaims()`, validates auth
- Inserts into `feedback` table with `user_id`, `category`, `title`, `message`
- Uses `handleError` utility on failure

```ts
import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function sendFeedback(feedback: {
  category: "bug" | "feature" | "general";
  title: string;
  message: string;
}) {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.sub,
    category: feedback.category,
    title: feedback.title,
    message: feedback.message,
  });

  if (error) {
    handleError(error, {
      message: "Error sending feedback",
      route: "/database/settings/send-feedback",
      method: "POST",
    });
    throw new Error("Error sending feedback");
  }

  return true;
}
```

---

## 3. Translations

**Edit:** `web/app/lib/i18n/locales/en/menu.json` — add `"feedback"` section:
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
  "emptyMessage": "Please enter a message.",
  "send": "Send"
}
```

**Edit:** `web/app/lib/i18n/locales/fi/menu.json` — add equivalent Finnish translations:
```json
"feedback": {
  "title": "Lähetä palautetta",
  "category": "Kategoria",
  "categories": {
    "bug": "Virheraportti",
    "feature": "Ominaisuuspyyntö",
    "general": "Yleinen palaute"
  },
  "titleLabel": "Otsikko",
  "titlePlaceholder": "Lyhyt yhteenveto",
  "messageLabel": "Viesti",
  "messagePlaceholder": "Kuvaile tarkemmin...",
  "sending": "Lähetetään palautetta...",
  "sendSuccess": "Palaute lähetetty! Kiitos.",
  "sendError": "Palautteen lähettäminen epäonnistui. Yritä uudelleen.",
  "emptyTitle": "Kirjoita otsikko.",
  "emptyMessage": "Kirjoita viesti.",
  "send": "Lähetä"
}
```

**Edit:** both locale files `"menu"` section — add feedback menu item:
- EN: `"feedback": "Feedback"`
- FI: `"feedback": "Palaute"`

---

## 4. Menu Page

**Edit:** `web/app/(app)/menu/page.tsx`

- Import `MessageSquareMore` from `lucide-react`
- Add a new `<LinkButton>` after Settings, before the bottom section:
  ```tsx
  <LinkButton href={"/menu/feedback"}>
    <p>{t("menu.feedback")}</p>
    <MessageSquareMore />
  </LinkButton>
  ```

---

## 5. Sidebar

**Edit:** `web/components/sidebar/MenuSidebar.tsx`

- Import `MessageSquareMore` from `lucide-react`
- Add a new `<LinkButton>` after Settings, matching the sidebar pattern:
  ```tsx
  <LinkButton href="/menu/feedback">
    <p>{t("menu.feedback")}</p>
    <MessageSquareMore size={18} />
  </LinkButton>
  ```

---

## 6. Feedback Page

**New file:** `web/app/(app)/menu/feedback/page.tsx`

- `"use client"` page
- Uses `page-padding max-w-md mx-auto` wrapper (per CLAUDE.md)
- Uses `useTranslation("menu")` for translations
- Form fields:
  - Category: `<select>` styled consistently (or a custom select component if one exists) with options bug / feature / general
  - `CustomInput` for title (with `label={t("feedback.titleLabel")}`)
  - `SubNotesInput` for message (multi-line)
- `SaveButtonSpinner` with label overridden to `t("feedback.send")`
- `FullScreenLoader` while sending (with `t("feedback.sending")` message)
- Success/error shown as colored text messages (`text-green-500` / `text-red-500`) matching the security page pattern
- Validation: title and message must be non-empty before submit
- On success: clear form fields and show success message
- All imports use absolute paths (per CLAUDE.md)
- No raw `<input>` elements — use existing components

---

## 7. Files to Create/Modify

| Action | File |
|--------|------|
| **Create** | `web/database/settings/send-feedback.ts` |
| **Create** | `web/app/(app)/menu/feedback/page.tsx` |
| **Edit** | `web/app/lib/i18n/locales/en/menu.json` |
| **Edit** | `web/app/lib/i18n/locales/fi/menu.json` |
| **Edit** | `web/app/(app)/menu/page.tsx` |
| **Edit** | `web/components/sidebar/MenuSidebar.tsx` |

---

## 8. Verification
1. Open the web app → Menu → verify "Feedback" / "Palaute" button appears in both the menu page and sidebar
2. Click it → feedback form page loads with category, title, message fields
3. Submit with empty fields → validation error messages
4. Fill in all fields and submit → success message, form clears, record appears in `feedback` table
5. Check Supabase: `SELECT * FROM feedback` shows the submitted row with correct user_id
6. Switch language to Finnish → all labels and messages display in Finnish
