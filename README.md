## XD-PoS-Automation

Automation and monitoring of the XD Orders PoS with FastAPI and a Next.js panel.  
This agent runs inside the restaurant network (or on the PoS machine itself), speaks the proprietary XD Orders TCP protocol, and exposes a simple HTTP API so Astra’s backend can orchestrate WhatsApp-native payments.

---

### 1. What is Astra?

**Astra** is a WhatsApp-native payment system for restaurants in Brazil.  
It shortens end-of-meal waiting time by letting guests review their bill and pay directly inside WhatsApp, fully integrated with the restaurant’s PoS.

- **Current problem**: at peak times, each payment at the cashier takes around 1–2 minutes. In a line of 10 customers, the last person can wait 10–20 minutes to pay.
- **With Astra**: multiple customers start payment in parallel via WhatsApp. The effective checkout time per customer converges to about 1–2 minutes, even when many people pay at once.

In the examples, we use the term **“order card (comanda)”** for the physical numbered card many Brazilian restaurants use to track a guest’s consumption.

---

### 2. Goal of this repo

This repository implements the **XD Orders PoS connector** that runs inside the restaurant.

- **Primary role**: mimic the waiter’s phone, speak the proprietary XD Orders TCP protocol, and expose an **HTTP API + web panel** that Astra’s NestJS backend can call over VPN.
- **Main responsibilities**:
  - **Fetch table data in real time** from the PoS (list all tables, load the full bill for a specific table).
  - **Update the table status in the PoS** to reflect the payment journey:
    - normal → **pre-bill / paying** → **closed / paid**.
  - Do this **without any official PoS API**, by reproducing the XD Android app’s behavior.
- This connector is **specific to the XD Orders PoS**. The higher-level abstraction (tables, bills, payments) lives in Astra’s NestJS backend, which can in the future connect to other PoS systems through similar connectors.

#### 2.1 Importance of this integration

- **Waiter anxiety about unpaid tables**: staff worried that customers might leave without paying if payment happened away from the cashier.
  - The solution is to **change the table status directly in the PoS**, keeping XD as the source of truth: waiters look at the PoS screen to see which tables are paying or paid.
- **Slow, linear checkout**:
  - Before: 10+ customers in line → each payment takes 1–2 minutes → the last one waits 10–20 minutes.
  - With Astra: everyone initiates payment in parallel via WhatsApp; this connector fetches the bill and drives status changes in the PoS automatically; checkout time per customer stays roughly constant (~1–2 minutes).
- **Modernizing a legacy PoS**:
  - XD Orders does not offer a public HTTP API.
  - This agent exposes a **REST facade** on top of the proprietary TCP protocol, so Astra’s backend can treat the PoS as if it had a conventional API.

#### 2.2 System architecture

- **Customer and restaurant**
  - Guest seated at the table or holding an **order card (comanda)**.
  - XD Orders PoS server running on the local network (e.g. `192.168.x.x`).
  - Waiter Android app talking to the PoS over **TCP on the LAN**.

- **Astra backend (cloud)**
  - **NestJS + MongoDB** backend running on an Oracle Cloud instance.
  - Integration with **WhatsApp Cloud / Graph API** (incoming webhooks + outbound messages).
  - Orchestrates the payment flow and decides when to call the PoS connector.

- **This repo: XD PoS connector (on-prem agent)**
  - Runs on a **Raspberry Pi or restaurant computer** as a **single Docker container** with:
    - **FastAPI backend** (Python) that:
      - Authenticates with the PoS vendor’s cloud (COTI/XD) over **HTTPS/TLS 1.3**.
      - Maintains a **TokenManager** that:
        - Fetches all keys available in the PoS cloud.
        - Tests those keys against the local PoS instance over TCP.
        - Persists the working key/token in a local JSON file for reuse.
      - Talks to the local PoS server over **plain TCP** using the XD mobile protocol (messages like `GETDATALIST`, `GETBOARDCONTENT`, `POSTQUEUE` with Base64/JSON payloads).
      - Exposes a simple REST API consumed by the NestJS backend and the Next.js panel.
    - **Next.js frontend** for observability:
      - Table list, details, pre-bill/close actions.
      - **Wire viewer** to debug TCP traffic (raw/hex/ASCII + decoded payloads).

- **Secure connectivity (VPN)**
  - The agent joins a **Tailscale network**, pre-configured and managed by Astra (keys, ACLs).
  - The NestJS backend calls the agent’s FastAPI endpoints using its **Tailscale IP/hostname**.
  - No ports on the restaurant LAN are exposed to the public internet.

- **Scope of allowed PoS actions (by design)**
  - **Allowed**:
    - Read tables, items, and totals.
    - Change table status to **pre-bill / paying**.
    - Change table status to **closed / paid** after payment confirmation.
  - **Not allowed (out of MVP scope)**:
    - Adding or editing items.
    - Applying discounts.
    - Voiding items, changing prices, issuing refunds, or other sensitive operations.

---

### 3. How it works

#### 3.1 Customer journey (WhatsApp checkout)

1. **Start**
   - The guest scans a **QR code** on the table or on the **order card (comanda)**.
   - This QR opens WhatsApp with a pre-filled message, for example:  
     **“Pay for table 20”**.

2. **Bill retrieval**
   - WhatsApp sends this message to Astra’s **NestJS** backend via webhook.
   - The backend interprets the intent (“pay table 20”) and calls the agent over Tailscale:
     - For example: `GET /tables/{table_id}/message/` and/or the `/frontend` APIs.
   - The agent:
     - Authenticates (or reuses a cached token) with the COTI/XD cloud.
     - Talks to the local PoS over TCP (`GETBOARDCONTENT`) to fetch the table bill.
     - Optionally uses the Groq LLM chain to build a WhatsApp-friendly summary.

3. **Bill confirmation in WhatsApp**
   - The guest sees the items and total directly in WhatsApp.
   - If they **confirm the bill is correct**, the NestJS backend:
     - Calls this agent’s **`/tables/{id}/payment`** endpoint.
     - The agent sends a **`POSTQUEUE` pre-bill** message to the PoS, moving the table status to **pre-bill / paying**.
     - This change happens **inside the PoS**, so waiters and managers trust what they see on the XD screen.

4. **Payment**
   - Astra sends a **Pix or card payment link** via WhatsApp.
   - The payment gateway processes the transaction and sends a **confirmation webhook** back to the NestJS backend.

5. **Closing the table in the PoS**
   - After successful payment, the NestJS backend:
     - Calls this agent’s **`/tables/{id}/close`** endpoint.
     - The agent sends a **`POSTQUEUE` close-table** message to the PoS.
     - The table status in the PoS becomes **closed / paid**, keeping XD Orders as the system of record.

6. **Result**
   - For the guest, everything happens in around 1–2 minutes, with no line at the cashier.
   - For the restaurant, **XD Orders remains the source of truth**, and the team clearly sees which tables are paying or already paid.

---

### 4. Running locally (dev / debug)

This section covers how to run the FastAPI backend and Next.js panel in development mode, using the mock client (no real PoS required).

#### 4.1 Backend (FastAPI)

- **Base endpoint**: `http://localhost:8000`
- **Main routes**:
  - `GET /tables` and `GET /tables/{id}`: list all tables or fetch a specific table.
  - `GET /tables/{id}/message/`: build the WhatsApp message from the table’s content.
  - `GET /tables/{id}/payment/` and `GET /tables/{id}/close/`: pre-bill and close-table actions.
- **Panel routes (include `wire_trace` with raw/hex/ASCII and decoded payloads)**:
  - `GET /frontend/tables`
  - `GET /frontend/tables/{table_id}`
  - `POST /frontend/tables/{table_id}/prebill`
  - `POST /frontend/tables/{table_id}/close`

##### 4.1.1 Running in mock mode (recommended for quick tests)

1. In `config.ini`, set `app_mode = dev`.
2. Start the API:

   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

3. In production, keep `app_mode = prod` to use the real `RestaurantClient` (actual PoS over TCP).

##### 4.1.2 AI and language settings

- **Groq**:
  - Set `GROQ_API_KEY` in `config.ini` to enable the `gpt-oss-120b` model from Groq (replacing OpenAI usage).
- **Language**:
  - Use the `language` field (`pt-br` or `en-us`) to control the language of the text generated by the backend and shown in the panel/WhatsApp.

#### 4.2 Frontend (Next.js + shadcn-ui)

The panel lives in `frontend/` (TypeScript, App Router, Tailwind, shadcn-ui).

1. Set up the environment:

   ```bash
   cd frontend
   cp .env.local.example .env.local  # adjust the API URL if needed
   pnpm install
   ```

2. Run in development:

   ```bash
   pnpm dev
   ```

3. Open `http://localhost:3000` (default Next.js port) to see:
   - Table list.
   - Table details, items, WhatsApp message, and action buttons.
   - WireViewer with TCP traffic (request/response, Base64-decoded payloads).

#### 4.3 Quick smoke check

1. Keep the backend running (ideally in mock mode).
2. Start the frontend with `pnpm dev`.
3. Open `http://localhost:3000`:
   - Verify the table listing.
   - Open a specific table and check items, WhatsApp message, and actions.
   - Expand the WireViewer to inspect TCP traffic (request/response, decoded payloads).


