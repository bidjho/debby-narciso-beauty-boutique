<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (Debby Narciso Cosmetics store)

- Public catalogue reads go through `src/lib/catalog.functions.ts` server functions with a per-request publishable client (`public-db.server.ts`); route loaders return that data directly (no query-cache hydration is configured). Why: SSR + SEO without leaking privileged keys.
- Admin CRUD uses the browser Supabase client and relies on RLS (`has_role(auth.uid(),'admin')`); `/admin` lives under `src/routes/_authenticated/` and also checks the role in `admin.tsx`. Why: database is the real security boundary.
- Visitor (anon) RLS policies must not call `has_role`; keep separate `TO anon` and `TO authenticated` SELECT policies. Why: anon cannot execute `has_role`.
- Roles live only in `user_roles` (`owner` ⊃ `admin`; owners always also hold `admin`); public signup is disabled. Team management (invite with temp password, change level, block via auth ban) runs only in `src/lib/team.functions.ts` after an `owner` check, with rules in `src/lib/team-rules.ts` (no self-changes, keep ≥1 active owner). Why: no self-registration and the store can never lock itself out.
- The `product-images` bucket is private with admin-only storage SELECT; images are stored by `storage_path` under `products/`, `categories/` or `site/` and served only via the cached `/img/$` server route (server-side read, path-validated). Why: stable, cacheable public image URLs without letting visitors list or read the bucket directly.
- Pricing/stock/WhatsApp rules live in `src/lib/pricing.ts` and `src/lib/whatsapp.ts`, covered by `src/test/store-rules.test.ts`. Why: single source of truth for money and order message.
