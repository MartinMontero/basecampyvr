# LOOP.md — basecampyvr.ca outage: run to verified completion

## Scope
Get https://basecampyvr.ca (and www) serving the Worker over TLS again — i.e. at least one
edge certificate covering `basecampyvr.ca` reaches **Active** and a browser TLS handshake succeeds.
**Non-goals:** README rewrite, GitHub Pages cleanup, form/Tally upgrades, Worker code changes.

## Confirmed root-cause chain (evidence in session transcript)
1. Browser: `SSL_ERROR_NO_CYPHER_OVERLAP` — edge presents no certificate for the SNI.
2. All 3 cert packs (2× advanced/Google via Worker Custom Domains, 1× universal/Let's Encrypt)
   stuck `pending_validation` (TXT DCV) since 2026-07-06 — never `active` since domain creation.
3. TXT DCV cannot complete: Cloudflare's own authoritative NS (gabriel/shaz) serves
   `_acme-challenge.basecampyvr.ca TXT` → NOERROR **empty**, while a **phantom catch-all**
   synthesizes proxied A/AAAA for EVERY name (any depth), even with the zone's record set empty.
   Control zone (`wecanjustbuildthings.dev`, same account) behaves correctly → zone-specific corruption.
4. Dashboard refuses adding the DCV TXT ("identical record already exists") while the API list/export
   shows no such record → hidden internal managed record exists but is not being served.
   → Control-plane vs serve-plane desync on this zone. Only Cloudflare can purge that state.

## Ruled out (each verified by direct query/API, not inspection)
CAA (none) · DNSSEC (disabled, no DS) · SSL mode/minTLS/ciphers (full/1.0/defaults) ·
Universal SSL disabled (it's on) · wildcard DNS record (zone export) · Worker routes (none) ·
Cloudflare-for-SaaS custom hostnames (0) · Pages projects (0) · Tunnels (0) · LBs (0) ·
Access apps (none on zone) · GitHub Pages interference (no CNAME file; GH cannot affect CF DNS serving).

## Journeys (site = static Worker `basecampyvr`)
1. https://basecampyvr.ca → TLS OK → index.html renders.
2. https://www.basecampyvr.ca → TLS OK → index.html renders.
3. https://basecampyvr.these3remain.workers.dev → TLS OK (Cloudflare-managed cert) → site renders. (Interim mirror.)

## Gates (this is an ops loop; "gates" = executable checks that must pass)
- G1: `GET /zones/:z/ssl/certificate_packs` shows ≥1 pack with `status=active` covering `basecampyvr.ca`.
- G2: authoritative NS query for the DCV name returns the required token (for TXT path) OR pack goes
  active via HTTP DCV (no DNS dependency).
- G3: browser (user-side, sandbox egress is blocked) loads https://basecampyvr.ca without TLS error.

## Fix attempts ledger
| # | Attempt | Mechanism | Result |
|---|---------|-----------|--------|
| 1 | Detach/re-attach Worker Custom Domains (×2) | force new cert order | new packs, still pending — TXT unreadable |
| 2 | Universal SSL off→on (×2) | fresh universal order | new pack, still pending — TXT unreadable |
| 3 | Forced DCV recheck (PATCH /ssl/verification) | re-queue validation | accepted; no effect — TXT unreadable |
| 4 | DCV delegation CNAME (`_acme-challenge` → `<uuid>.dcv.cloudflare.com`) | delegate token serving | record in control plane but NOT served (phantom layer masks it) |
| 5 | User adds literal DCV TXT in dashboard | serve token directly | rejected: "identical record already exists" (hidden internal record) |
| 6 | Switch universal pack to HTTP DCV | bypass DNS entirely | rejected: `Allowed options: txt` (pack contains wildcard) |
| 7 | Order NON-wildcard advanced pack, `validation_method=http` | HTTP DCV — CA fetches token over port 80 at CF edge; phantom wildcard irrelevant | REJECTED: code 1450, requires paid ACM add-on |
| 8 | SaaS custom hostnames (`basecampyvr.ca`, `www`) with `ssl.method=http` | same HTTP-DCV bypass via Cloudflare for SaaS (free ≤100 hostnames) | **ACCEPTED** — both created 2026-07-12, Google DV certs provisioning via edge-served HTTP challenge; polling to active |
| 9 | (fallback) API-write literal TXT (needs DNS:Edit token from user) | override serve-plane | blocked on token |
| 10 | (last resort) Cloudflare support ticket to purge corrupted zone state | fix serve-plane desync | drafted |

## Assumptions
- Sandbox egress policy blocks reaching basecampyvr.ca and all external SSL checkers → browser
  verification (G3) is user-side; recorded as UNVERIFIED-here with reason when claimed.
- `workers.dev` URL functions (Cloudflare-managed TLS) — used as interim mirror; cannot be
  fetched from sandbox for the same egress reason.

## Out-of-scope findings (logged, not built)
- README/repo still claim GitHub Pages hosting; `github-pages` deployment env still builds on every
  push. Harmless to the outage; cleanup candidate.
- Zone shows `AAAA 100::` placeholder records managed by Worker Custom Domains — expected.
