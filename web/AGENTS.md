<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portal Arduino - project rules

- Do not start, stop, restart, or replace the development server unless the user explicitly asks for it.
- Assume the user keeps the server running. If server state needs to change, ask the user to do it.
- If verification needs a running server and it is not available, report that clearly instead of starting one.
- Use `F:\ARDUINO\.agents\DESIGN.md` as the source of truth for all visual design and style decisions. Before changing UI, read that file and align colors, typography, spacing, radii, surfaces, buttons, cards, and imagery with it.
- Local Next.js and Vercel production intentionally use the same Convex production backend for now. Do not use `npx convex dev` for normal local work; when Convex code or schema changes, verify and deploy with `npx convex deploy`.
- End every user-facing communication with this exact icon sequence: `➖➖➖➖➖➖🆗➖`
