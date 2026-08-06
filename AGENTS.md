<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:responsive-phone-preview -->
# iPhone preview = official mobile responsive (storefront + admin)

The local iPhone design shell (`?shell=1` / DevIphoneShell) is the source of truth for **mobile** UI on the **website and admin dashboard**.

- Edits in the shell must ship as real responsive mobile layout (narrow containers / real phones), not `html.phone-sim`-only cosmetics.
- Use `@container` on shop layout and `admin-shell` with `@3xl` / `@5xl` so phone preview and real mobile match.
- Keep `html.phone-sim` limited to shell chrome (clip, scroll lock, forcing mobile chrome on a wide desktop viewport).
- Default assumption while the shell is open: **mobile-only** changes unless the user asks for desktop too.
<!-- END:responsive-phone-preview -->
