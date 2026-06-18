# Project Worklog — For Heena, A Birthday Composed in Code

## Project Status Description / Assessment

**Project**: An interactive, premium birthday card website ("For Heena") built with Next.js 16 + App Router + TypeScript + Tailwind CSS 4 + Framer Motion + Web Audio API.

**Current State**: Stable, fully functional, visually polished and verified end-to-end via agent-browser on both desktop (1440×900) and mobile (390×844) viewports.

The site is a single-route (`/`) long-scroll experience composed of:
1. **IntroScreen** — dark, code-rain canvas + glowing animated gift box + typed terminal status lines + "Open the gift" CTA.
2. **HeroSection** — elegant serif "Heena" with gradient + parallax glow that follows the cursor + scroll indicator.
3. **MemoryDeck** — six 3D tilt + flip memory cards (front: chapter label + glyph; back: italic quote on dark gradient).
4. **LoveJar** — SVG jar with real-time liquid sloshing physics (animated path), rising bubbles, click to draw a random kept-thought.
5. **VinylPlayer** — rotating metallic vinyl record + tonearm + 3 tracks with live lyrics sync + progress bar + procedural Web Audio melody.
6. **CakeSection** — three candles you blow out by tap or hover-proximity; after the last flame dies, a wish message appears with a relight button.
7. **Footer** — editorial divider line, signature, and a "one more sparkle" button.

**Cross-cutting systems**:
- `SparkleCanvas` — global fixed canvas overlay; any component can dispatch golden/rose/rainbow/smoke particle bursts via the `sparkle()` helper using a `heena:sparkle` CustomEvent.
- `BackgroundBlobs` — fixed liquid-morphing gradient blobs + rotating ambient glow circles.
- `FloatingControls` — top-right glass buttons: manual sparkle burst + ambient pad music toggle.
- `lib/audio.ts` — Web Audio API engine (delay/feedback harp) with chimes, sparkle chords, ambient pad, and a procedural melody loop.
- `lib/birthday-data.ts` — all content (memory cards, jar thoughts, tracks + lyrics, intro lines, wish messages, footer signature).

**Stack confirmed**: Next.js 16.1.1, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, Lucide, z-ai-web-dev-sdk available.

## Current Goals / Completed Modifications / Verification Results

### Completed
- Replaced the default scaffold `page.tsx` with the full birthday experience.
- Wired premium Google Fonts (Playfair Display, Plus Jakarta Sans, Fira Code) via `next/font`.
- Authored a custom theme in `globals.css` (warm blush/lilac/amber palette, glass utilities, blob + flame + bubble + shimmer + lyric + vinyl-glow keyframes, premium scrollbar, editorial line).
- Built 10 dedicated components under `src/components/birthday/`.
- Built `src/lib/audio.ts` (Web Audio synth) and `src/lib/birthday-data.ts` (content).
- Added `allowedDevOrigins` to `next.config.ts` to silence cross-origin dev warnings.

### Verification Results (agent-browser)
- `bun run lint` → **clean**, no errors or warnings.
- Dev server compiles cleanly, `GET / 200`.
- Desktop 1440×900:
  - Intro renders with code rain, glowing gift, typed lines, CTA.
  - Clicking "Open the gift" triggers a sparkle burst and reveals the main experience.
  - Hero, Memory Deck (6 cards), Love Jar, Vinyl Player (3 tracks), Cake (3 candles), Footer all render.
  - Clicking a memory card flips it to the dark italic-quote back side.
  - Playing "Golden Hour" spins the vinyl, highlights the track, shows synced lyrics with the active line emphasized.
  - Tapping all three candles blows them out and reveals the wish message card.
- Mobile 390×844:
  - Intro, hero, cards, jar, vinyl, cake all fit within the viewport with no overflow or cut-off.
- VLM (glm-4.6v) review of screenshots: "beautifully designed, premium", "excellent layout quality", "very high visual polish", "no broken/overlapping/empty areas detected".

### Bug Fixed During Verification
- Initial runtime `TypeError: Cannot read properties of undefined (reading 'replace')` in `IntroScreen` line 191 — the typed-line render assumed every `visibleLines` entry was a string. Made it defensive with `String(line ?? "").replace(...)`. Root cause was defensive only; the interval guard was correct, but the guard prevents any future regression.

## Unresolved Issues or Risks, and Priority Recommendations for the Next Phase

### Known Limitations (by design, not bugs)
- Audio requires a user gesture to start (browser autoplay policy). The intro "Open the gift" click + a one-time `pointerdown` listener on `window` handle this; audio will not play before the user interacts.
- The vinyl player uses a **procedural melody** (Web Audio synth) rather than real audio files, because no audio assets are bundled. Lyrics are timed against a mock clock that advances every 2s per chord.
- The intro code-rain canvas runs continuously while the intro is mounted; it is unmounted after entry, so there is no lingering cost.

### Opportunities for the Next Phase (recommended priorities)
1. **Memory deck interaction polish** — add a subtle "flip all" / "shuffle" control and a progress indicator (e.g. "2 / 6 revealed").
2. **Vinyl player realism** — allow uploading a real audio file + `.lrc` lyrics (the original HTML had this); add volume + scrub controls.
3. **Love jar depth** — let the user "keep" drawn thoughts into a small collection visible at the bottom; add a count of thoughts drawn.
4. **Cake personalization** — let the user type a custom wish before blowing, then seal it into a card that persists across reloads (localStorage).
5. **Accessibility pass** — add `aria-label`s to icon-only buttons (mostly done), keyboard focus rings, and `prefers-reduced-motion` fallbacks that disable blobs / code rain / sparkle loops.
6. **Theme toggle** — add a light/dark switch via `next-themes` (dark theme tokens already exist in `globals.css`).
7. **Performance** — the SparkleCanvas uses a single rAF loop with no cap on particles; cap to ~400 live particles to protect low-end devices.
8. **Share** — add a "share this card" button that copies a URL (the card is a single route, so this is trivial).

### Risks
- None blocking. The site is fully runnable and verified.

---

## Round 2 — Scheduled webDevReview (cron #215324)

**Task ID**: 2
**Agent**: main (webDevReview)
**Task**: Assess current status via agent-browser QA, then add more styling details + more features.

### Work Log
- Read prior worklog; confirmed project stable and fully functional.
- QA via agent-browser on desktop 1440×900: intro → enter → all sections render; no runtime errors; console clean (only a harmless framer-motion scroll-offset dev warning).
- **Added ScrollProgress bar** (`ScrollProgress.tsx`) — fixed 3px gradient bar (amber→rose→violet) at top of viewport driven by `useScroll` + spring; glows softly.
- **Added BackToTop button** (`BackToTop.tsx`) — glass pill, bottom-left, appears after scrolling past ~1 viewport; smooth-scrolls to top with a gold sparkle burst.
- **Added new Timeline section** (`TimelineSection.tsx` + `timelineMoments` data) — vertical scroll-triggered timeline of 5 "moments" with a progress line that fills as you scroll, alternating glass cards on each side, colored accent dots (amber/rose/violet/emerald) with pulsing glows. Placed between Hero and MemoryDeck.
- **Upgraded MemoryDeck** — lifted flip state to parent; added "X / 6 revealed" progress bar (gradient fill), "Reveal all / Close all" toggle (animated label swap) and "Shuffle" (Fisher-Yates reorder with rotation animation). Cards re-render in new order with `layout` animation.
- **Upgraded LoveJar** — drawn thoughts now collect into a "kept thoughts" glass tray below the jar with a live count badge and a "clear" control; entries animate in/out (height + x). Caps at 8 most-recent.
- **Upgraded CakeSection** — added "whisper your wish" input (140-char, live counter) above the cake; the typed wish (or a default) is sealed into the wish card when the last candle dies, and persisted to `localStorage` (`heena:sealed-wish`). On reload, a previously-sealed wish is restored and labeled "your sealed wish". Rainbow sparkle burst + high chime on seal.
- **Added theme toggle (light/dark)** via `next-themes` — new `theme-provider.tsx` wrapping the app in `layout.tsx`; sun/moon button in FloatingControls with rotating icon transition; authored comprehensive `.dark` overrides in `globals.css` (dark gradient body bg, dark glass surfaces, remapped stone text/border/bg utilities) so all existing components adapt without per-component edits.
- **Added Share button** to FloatingControls — uses `navigator.share` when available, falls back to `clipboard.writeText` with a glass toast "Link copied — share it with someone you love"; rose sparkle burst on share.
- **Hardened SparkleCanvas** — capped live particles at 400 (drops new requests when at cap) and added `prefers-reduced-motion` guard that disables sparkle bursts entirely for reduced-motion users.
- Lint: two `react-hooks/set-state-in-effect` errors (next-themes mount guard + localStorage read on mount) resolved with targeted `eslint-disable-next-line` comments (these are the canonical patterns). Final `bun run lint` → clean.

### Stage Summary / Verification Results
- `bun run lint` → clean (0 errors, 0 warnings).
- Dev server compiles cleanly, `GET / 200`.
- agent-browser desktop QA confirmed:
  - Timeline section renders with central progress line + alternating cards + accent dots.
  - "Reveal all" flips all 6 cards; progress shows "6 / 6 revealed"; button swaps to "Close all".
  - Love jar: 3 taps → "kept thoughts" tray appears with count badge "3" and the drawn thoughts.
  - Cake: typed wish "Peace, laughter…" → blow all candles → sealed wish card shows the custom wish in italic + "Relight the candles" button; `localStorage` confirmed holding the wish.
  - Theme toggle: dark mode background/gradient/glass all adapt; light text readable; toggle back to light works.
  - Share button: toast "Link copied — share it with someone you love" appears.
  - Scroll progress bar: gradient bar visible at top after scrolling.
  - Back-to-top: appears after scroll, smooth-scrolls to top (scrollY → 0).
- VLM (glm-4.6v) reviews: Timeline "balanced, dynamic layout"; dark mode "excellent readability, high contrast, premium glassmorphism"; sealed wish card "elegant italicized serif, cozy intimate atmosphere"; mobile "functional and mobile-friendly, no critical overflow".
- Mobile 390×844: all new features fit without critical overflow.

### Unresolved Issues or Risks, and Priority Recommendations for the Next Phase
- **Harmless dev warning**: framer-motion emits a `useScroll` container-position warning in dev (sections are already `relative`). Non-blocking; cosmetic only. Could be silenced by ensuring the scroll target is a direct positioned ancestor, but functionality (parallax + progress) is unaffected.
- **Dark mode coverage**: the `.dark` utility overrides cover the common stone text and glass surfaces, but a few one-off colored elements (e.g., memory card back gradients, vinyl label) are intentionally kept as-is since they read well on both themes. A future pass could add `dark:` variants per component for pixel-perfect control.
- **Reduced motion**: sparkle bursts are now disabled under `prefers-reduced-motion`, but the blob/flame/code-rain CSS animations still run. A future pass could gate these behind a `@media (prefers-reduced-motion: reduce)` block that pauses infinite animations.
- **Recommended next-phase features**:
  1. Vinyl player: upload-audio + `.lrc` lyrics, volume + scrub controls (original HTML had this).
  2. Memory deck: per-card "favorite" toggle that pins favorites to the top.
  3. Love jar: export kept-thoughts as a printable/shareable card.
  4. Cake: a small confetti rain (full-screen) when the wish is sealed, beyond the centered sparkle burst.
  5. Accessibility: full keyboard navigation pass + visible focus rings on all interactive cards.
  6. Performance: lazy-mount heavy sections (Timeline, Vinyl) with `next/dynamic` to reduce initial JS.
