# Architecture section — storytelling restructure

A draft for the `<ArchitectureSection />` rewrite. **No code changes
yet** — this is the prose, in the order it'd appear, so you can redline
it in your voice before I touch the tsx.

---

## Proposed final order

| # | Block                          | What renders                                                |
|---|--------------------------------|-------------------------------------------------------------|
| 1 | Header (lightly tweaked)       | existing eyebrow + title + the *"does this work…"* italic   |
| 2 | **Act A · Listen** prose       | one short paragraph — no diagram                            |
| 3 | **Act B · Read** prose         | bridging prose → `<DecompiledCode />` → followup paragraph  |
| 4 | **Act C · Write** prose        | bridging prose → `<PacketInspector />` → followup paragraph |
| 5 | **Act D · Deploy** prose       | bridging prose → `<DeploymentTopology />` → followup paragraph |
| 6 | **Payoff** prose               | bridging prose → `<SequenceDiagram />`                      |
| 7 | What generalizes (kept)        | existing card with three bullets, lightly tightened         |

### What goes away

- The **`PHASES` const + `PhaseCard` grid** at the bottom. The four
  acts above *are* the phases — labelling them again at the end was
  what made the section feel disjointed in the first place.
- The standalone **`TokenRevealHeader`** ("One more thing — Where did
  the TOKEN come from?"). Its content folds into the Act C bridge
  ("…and a TOKEN field that's the access token we just watched the
  OAuth call return"). The reveal is now causal, not parenthetical.

### What moves

- **`<SequenceDiagram />`** moves from the top to the very end. It
  becomes the climax, not the table-of-contents. The existing caption
  ("We're nowhere in this picture") only earns its weight once you've
  seen the work.
- **`<DecompiledCode />`** moves from after the inspector to before
  it. The decompile is what *enables* reading the bytes, so it should
  precede the bytes — chronologically and causally.

---

## The drafts

Format: prose in blockquotes (paste-able), inline notes in `[brackets]`.

### 1 · Header (lightly tweaked)

Keep everything. Add one line at the end that names the four acts so
the reader has a mental map.

> 02 / Architecture
>
> **The solution had to work without the founders in the room.**
>
> After ~20 payments processed by hand on the floor until 2 a.m., the
> client clearly saw the value. A new hypothesis followed:
>
> *does this work when we're not in the room?*
>
> Our Achilles' heel: the waiters' ability to recommend the payment
> system at every table. What follows is how we took ourselves out of
> the loop — **four moves: listen, read, write, deploy.**

---

### 2 · Act A · Listen

Short. No diagram. Sets the scene and ends on the hook for Act B.

> **A · Listen**
>
> The first night, a laptop on shop wifi rewriting the handheld's
> gateway and DNS so every packet it sent or received crossed an
> interface we controlled. An HTTPS proxy terminated the cloud calls
> where it could. The PDV — the box on the counter — we never touched.
>
> By morning we had captures. We also had no idea what the captures
> meant.

---

### 3 · Act B · Read

Bridging prose → `<DecompiledCode />` → followup.

> **B · Read**
>
> Bytes show you that messages exist. They don't tell you what to send.
>
> So we pulled the APK. The Android handheld app gave up more than the
> Windows PDV ever would — sandbox constraints, clear socket contracts,
> code that survived unplugs. Decompile, and the protocol's shape, the
> auth flow, the retry logic were all sitting in three Java files.

`[<DecompiledCode />]`

> Hard-coded constants in `XDApi.java`. An OAuth handshake in
> `SecuredRestBuilder.java` that returns an access token. A line in
> `GetBoardInfoMessage.java` that splices that token into every TCP
> message. The vendor wrote the protocol; reading the vendor's own
> client was easier than guessing.

---

### 4 · Act C · Write

Bridging prose → `<PacketInspector />` → followup. **This is where the
TOKEN reveal folds in** — no separate "one more thing" header needed.

> **C · Write**
>
> Two halves now: the bytes on the wire, and the source that built
> them. Cross-reference, and a protocol falls out — a TCP dialect with
> delimiters where commas would be, base64 where structure would be,
> and a `TOKEN` field that's the access token we just watched the
> OAuth call return.

`[<PacketInspector />]`

> Once you can read this, you can write it. We could now form a
> pre-bill, a split, a close — the same messages the waiter's handheld
> sends from inside the shop's LAN.

---

### 5 · Act D · Deploy

Bridging prose → `<DeploymentTopology />` → followup.

> **D · Deploy**
>
> Knowing the protocol still wasn't enough. The PDV trusts whatever
> speaks to it from inside the shop's LAN — and that's where the
> handheld lives, not us. So we put a Raspberry Pi there too. A
> FastAPI agent in Python, dropped on the Pi, driven over a private
> outbound tunnel by the same NestJS that handles the WhatsApp
> webhook.

`[<DeploymentTopology />]`

> Three trust zones, stacked. The vendor zone we never touch. Our
> cloud and the agent on the Pi do all the work.

---

### 6 · Payoff

Bridging prose → `<SequenceDiagram />`. The existing caption inside
the diagram stays — it now lands.

> **The result, in motion**
>
> Put it all together: a guest pays on their own phone, a webhook
> fires, our cloud drives the agent, the agent pushes a `POSTQUEUE`
> down the LAN, the PDV flips state, and the waiter's handheld sees
> the table change on the next poll. About 180 milliseconds, end to
> end.

`[<SequenceDiagram />]`

`[existing caption stays:]`
> Guest pays on their own phone. The waiter's handheld sees the table
> flip on the next poll. We're nowhere in this picture.

---

### 7 · What generalizes (kept, one bullet tightened)

> **What generalizes**
>
> - Reverse-engineering a client is often cheaper than waiting for a
>   vendor to ship an API.
> - A signed APK is a narrower, cheaper attack surface than a compiled
>   desktop binary. **Read the source; don't guess from bytes.**
> - Token persistence, tested against the live system, is a pattern
>   worth reusing any time you sit between a cloud auth provider and a
>   local cache.

---

## Notes on the rewrite, in case you want to tune the voice further

- Each act opens with a short prose paragraph that **carries motion
  forward from the previous act** (`So we pulled the APK`, `Two halves
  now`, `Knowing the protocol still wasn't enough`). That's the
  connective tissue you said was missing.
- Each act closes with a follow-up paragraph **after** the component
  that names what was just shown and prepares the next move. The
  component stops being a self-contained card and becomes evidence in
  a paragraph.
- Act labels are bare (`A · Listen`, `B · Read`, …) instead of giving
  each one its own eyebrow + h3 + intro paragraph the way the current
  page does. Less repeating chrome, more reading.
- The TOKEN reveal becomes a causal aside in Act C ("…the access token
  we just watched the OAuth call return") rather than a separate
  section. The reader's already primed because they just saw the
  decompile.
- The `Phase A/B/C/D` grid disappears — the acts replace it. If you
  want a quick visual anchor, we can add a 4-step minimap at the top
  of the section (numbered chips: 01 Listen · 02 Read · 03 Write · 04
  Deploy), each linked to its act. Optional.

---

## Open questions for you

1. **Voice check on each act's opening line** — do these sound like
   you? Particularly:
   - "The first night, a laptop on shop wifi…"
   - "Bytes show you that messages exist. They don't tell you what to send."
   - "Two halves now: the bytes on the wire, and the source that built them."
   - "Knowing the protocol still wasn't enough."

2. **The four-act framing.** I called them "Listen, Read, Write,
   Deploy". You'd previously had "Intercept, Decompile, Synthesize,
   Deploy". The new naming is more conversational; the old is more
   precise. Pick.

3. **Sequence diagram at the end** — agree? It commits to chronology,
   but loses the up-front hook for first-time scanners.

4. **The optional 4-step minimap at the top** — yes, no, maybe.

When you're happy with the prose, I'll wire it into
`components/landing/architecture-section.tsx` (and remove the bits
listed under "what goes away").
