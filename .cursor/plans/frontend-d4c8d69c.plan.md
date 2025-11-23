<!-- d4c8d69c-73e9-4f62-b171-9d41f76af6eb 68bf3895-ad4c-478f-b4c5-de61459f102e -->
# Frontend Debug Console Plan

## 1. Add TCP trace instrumentation

- Extend `src/clients/restaurant_client.py` with reusable helpers that return both domain data and a `wire_trace` object (`raw`, Base64-decoded payloads, ASCII/hex) for list tables, table content, prebill, and close table operations.
- Reuse existing builders/decoders where possible to avoid duplication; add small utilities if needed (e.g., `_build_wire_trace`, `_decode_queue`). No existing endpoint behavior should change.

## 2. Expose trace-friendly FastAPI routes

- Create a new module (e.g., `src/api/frontend_monitor.py`) that defines an `APIRouter` with routes under `/frontend`:
- `GET /frontend/tables` → tables + trace.
- `GET /frontend/tables/{table_id}` → table content + trace.
- `POST /frontend/tables/{table_id}/prebill` and `/close` → action result + trace.
- Inject router in `app.py` via `app.include_router(...)` to keep the core module clean, and document expected base URL (`http://localhost:8000`).

## 3. Bootstrap the Next.js + shadcn UI workspace

- Scaffold `frontend/` using `pnpm create next-app` (TypeScript, App Router, Tailwind). Configure `.npmrc`, `.gitignore`, and scripts to run with pnpm.
- Install shadcn UI (`pnpm dlx shadcn-ui init`) and generate essentials (`button`, `card`, `tabs`/`toggle-group`, `table`, `toast`). Commit shared theme tokens.
- Add `.env.local.example` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` and update root `README.md` with run instructions for both API and frontend.

## 4. Implement frontend data layer & UI flow

- Create `frontend/lib/api.ts` (REST helper that reads `NEXT_PUBLIC_API_BASE_URL`) plus TypeScript types mirroring new endpoints (tables, table content, wire traces, action payloads).
- Table list page (`frontend/app/page.tsx`): server component fetches `/frontend/tables`, renders status cards, integrates shadcn table, and shows latest trace via a collapsible WireViewer.
- Table detail route (`frontend/app/tables/[tableId]/page.tsx` + client subcomponents): display table meta, order lines, WhatsApp message (call existing `/tables/{id}/message`), and action buttons for Prebill/Close that show toast feedback.
- Build reusable `WireViewer` component (segmented control for `raw`/`base64`/`ascii`, request vs response tabs) and smaller UI primitives (status badges, action panel). All toggles should default to `raw` but remember selection per viewer when possible.

## 5. Verification & docs

- Add lightweight smoke check instructions (running FastAPI in mock mode + `pnpm dev` for frontend) to `README.md` and note how to switch environments.
- (Optional) Provide a `frontend/package.json` script alias (`pnpm dev`) and mention how to configure ports to avoid conflicts with FastAPI.

### To-dos

- [ ] Add RestaurantClient helpers that return wire traces
- [ ] Implement /frontend router + include in app.py
- [ ] Scaffold frontend Next.js app with pnpm/tailwind/shadcn
- [ ] Implement data layer & UI (tables list/detail, wire viewer)