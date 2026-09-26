# Session Notes — September 26, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, and only then took the one change with the highest usefulness-per-risk.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24 instruments),
the connective tissue (`carry.ts`, `answerLog.ts`, `portable.ts`, `ics.ts`), the
design system (`globals.css`), and the last several sessions' notes. I also sent a
read-only survey agent across every tool client to map one thing precisely: the
deferred backlog's top-named item, the answer-now "start a new decision" reset.

The first thing I found was that **most of the running deferred list is already
done.** The reset control the Sept 24 notes flagged as the strongest remaining
gap shipped the very next session as the shared `ClearCallButton`, now on all 18
answer-now tools (last commit: "give every quick tool a safe way to start the next
decision"). The calendar-reminder idea I reached for independently already exists
as `ics.ts`, wired into the journal reviews and the pre-mortem tripwires. Search
typo-tolerance, crux sharing, near-miss recovery — all landed in the last week.
The kit's *internal* gaps are, by and large, closed.

So instead of hunting for a smaller and smaller internal papercut, I looked
outward for the change that would make the whole instrument more *useful to a real
person in the moment they actually reach for it* — and found one large, coherent
thing the site had never done.

## The gap I closed — the toolkit couldn't leave the tab it was born in

Every promise on the homepage points the same direction: *it's private* (nothing
leaves your browser), *the record is yours* (kept on your device), *it brings you
back*. The site has spent a year making the data local-first and honest about it.
But the **instrument itself** still only existed as a website you had to navigate
to, in a browser, with a connection. The one place a real decision gets made —
on a phone, on a plane, in a waiting room, in the quiet ten minutes before you
have to answer someone — is exactly where a tab you have to find and a network you
might not have let you down.

That is the natural, unbuilt end of the site's own thesis: if the data already
lives on your device and needs no server, the *tool* should too. So I made Better
Every Day an **installable, offline-capable app** — a Progressive Web App. It's
not a new instrument (the saturation trap every recent session has refused); it's
the same 24 instruments, finally available the way a private, local-first tool
should be: one tap from a home screen, running with no signal at all.

## What the change is, concretely

Ten files, all additive, no existing tool touched beyond three lines of wiring in
the layout:

- **`app/manifest.ts`** — the web app manifest (Next's `MetadataRoute.Manifest`),
  which makes the site installable and defines how it opens: `display:
  "standalone"` (its own window, no browser chrome), the site's cream/brown
  colors, and four icons at 192/512 declared both plainly and `maskable` so
  Android's icon mask crops cleanly. The description derives its tool count from
  the registry (`toolCountWord`), so it can't go stale — the same discipline the
  rest of the site's counts use.
- **`app/data/brandIcon.tsx`** — one shared brand mark, drawn once with `next/og`
  (the same engine `opengraph-image.tsx` already uses) and reused at every size:
  three rising bars in the site's cream on the accent brown — "better every day"
  as a shape, echoing the accent bar on the OG card. No binary icon to
  hand-maintain; every size is generated from this one source.
- **`app/icon.tsx`**, **`app/apple-icon.tsx`**, **`app/manifest-icon-192/route.tsx`**,
  **`app/manifest-icon-512/route.tsx`** — the mark rendered for the browser tab
  (32px), the iOS home screen (180px), and the manifest (192/512). A quiet bonus
  fix: the repo shipped with the **default create-next-app favicon** (the Next.js
  logo) in every tab — off-brand for a site that has otherwise worked hard to
  present as the instrument it is. `icon.tsx` replaces it with the site's own mark.
- **`public/sw.js`** — the service worker, the offline half. Design below.
- **`app/components/ServiceWorkerRegister.tsx`** — registers the worker after
  `load`, production-only, feature-guarded, failure-silent. Renders nothing.
- **`app/offline/page.tsx`** — the graceful fallback shown when someone navigates
  offline to a page their device hasn't saved yet. Deliberately reassuring: the
  point of an offline notice on a local-first site is to make clear *nothing was
  lost* — the work is on the device, not on a server that just became unreachable.
- **`app/layout.tsx`** — three additions: the `viewport` theme-color (light/dark,
  so the standalone status bar matches the page), the `appleWebApp` metadata, and
  the registrar. Next injects the `<link rel="manifest">` automatically.

## The one decision I'd defend hardest — a service worker that is a no-op online

A service worker is the single web feature that can persist a mistake past one
visit: a bad cache can pin a broken version on a real person with no easy remote
recovery. That is exactly the "hard to reverse" risk the site's conservative
discipline exists to avoid. So the worker is built around one rule that makes it
safe: **when the network is available, it behaves exactly as if it weren't there.**

- **Navigations (HTML pages) → network-first.** An online visitor *always* gets
  the fresh page from the network; the cache is only ever a fallback for when the
  network fails. A stale or broken HTML response can therefore never be pinned on
  someone who is online. The failure mode is "offline" — which, without a service
  worker, is a hard browser error anyway, and here becomes a cached page or a
  graceful notice instead. Worst case ≈ current behavior, the exact bar the recent
  notes hold every change to.
- **Immutable build assets (`/_next/static/…`, including the self-hosted fonts) →
  cache-first.** Their URLs are content-hashed by Next, so they change whenever
  their content does; serving them from cache can never be stale, and it's what
  lets an already-visited page render with no connection.
- **Everything else → untouched.** Cross-origin, non-GET, API-like requests fall
  straight through to the browser.
- Caches are **versioned** and the old ones are dropped on activate; the two front
  doors (`/`, `/tools`) plus the offline page are precached so a fresh install
  works offline immediately, not only for pages the person happened to open.

This is the standard, well-understood safe pattern (what Workbox generates), kept
small and auditable rather than pulled in as a dependency — no change to
`package.json` or `bun.lock`.

## How I verified it — and the one thing I couldn't, and why

Clean checks, clean tree: `bunx tsc --noEmit`, `bun run lint`, and a full
`bun run build` (all routes) pass; `node --check public/sw.js` confirms the worker
is valid. `git status` shows exactly the ten intended files; `package.json` and
`bun.lock` are untouched (the browser driver lived only in the scratchpad).

I wanted the recent sessions' habit — reality-test the *rendered* product, not the
source — and I got most of the way there by an unusual route. **This environment
kills any long-lived local server process** (a sandbox guard, `SIGSTKFLT`, fires a
second or two after a server starts listening, and reliably when a headless
browser runs alongside it), so I could not drive the built site in a browser. What
I did instead was read Next's **prerendered build output directly off disk** —
which is the exact bytes the server would send — and asserted every static-checkable
claim against it:

- `manifest.webmanifest.body` is well-formed JSON, served as
  `application/manifest+json`, with the resolved count ("twenty-four"), `standalone`
  display, the right colors, and all four icons including the maskable pair.
- The four icon bodies are genuine PNGs (verified magic bytes `89 50 4E 47`) at
  sensible sizes (32→230 B, 180→1.7 KB, 192→1.9 KB, 512→10.6 KB), each
  `content-type: image/png`.
- The prerendered home `<head>` carries the manifest link, both light/dark
  `theme-color` metas, `mobile-web-app-capable` (Next 16's current standardized
  replacement for the apple-prefixed one), the apple title and status-bar metas,
  the `apple-touch-icon` link, and the branded `icon` link.
- The offline page prerenders with `noindex` and its reassuring copy.

**What remains unexercised here is only the service worker's *runtime* offline
caching** — install/activate, the cache fills, the offline fallback on a real
navigation. That needs a browser pointed at a running server, which this sandbox
won't allow together. It's the one honest gap in today's verification. It is
mitigated by the design (worst case online = today's behavior), the syntax check,
the build's own compilation of the registrar, and the fact that the strategy is a
textbook network-first pattern. When this deploys to Vercel it should be confirmed
live: install to a phone home screen, load a page, go to airplane mode, reopen —
the visited page should load, and a never-seen page should show the offline notice.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. Refused again; no canonical or connective hole justified one.
- **Hunting another sub-single-file internal papercut** — the honest read is the
  internal backlog is largely closed (reset ✓, calendar ✓, search recovery ✓,
  crux sharing ✓). Chasing a smaller one would have been motion, not usefulness.
- **A heavier PWA toolchain** (`next-pwa`, Workbox, a build plugin) — unnecessary
  weight and a dependency on the site's clean, dependency-light footing. A ~90-line
  hand-written worker does exactly what's needed and nothing else.
- **A cache-first-everything worker** (the tempting "make it fast" version) — the
  precise footgun the safety rule above rejects; it would risk serving stale HTML
  to an online person, the one thing a network-first worker structurally can't do.

## What I deliberately left for later

- **Live runtime verification of the service worker**, per above — the one thing
  the sandbox blocked. Worth a five-minute manual check on the deployed site.
- **A richer offline surface.** Today's offline fallback is a single honest page.
  A nice future touch: list the specific instruments the person has already opened
  (readable from the caches) so offline navigation is a menu, not just a notice.
- **The `share.ts` sweep** (`ruin`, `enough` as next adopters) — still real, still
  deferred, still per-tool work on a saturated kit; lower usefulness-per-risk than
  making the whole instrument installable and offline-capable.
- **An `apple-touch-startup-image`** (the iOS splash) — a polish item that needs
  per-device sizes; skipped to keep the change focused.
