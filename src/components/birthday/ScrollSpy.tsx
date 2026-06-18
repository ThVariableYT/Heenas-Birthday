"use client";

import { useEffect, useState } from "react";

type SectionMeta = { number: string; eyebrow: string };

/**
 * ScrollSpy — a fixed top-center pill that shows the user which numbered
 * section they're currently reading. Observes every SectionHeader (which
 * publishes `data-section-number` + `data-section-eyebrow` attributes) and
 * picks the one closest to the viewport's "reading line" (top third).
 *
 * The headers may not exist at mount (the main content is gated by the intro
 * "Open the gift" interaction), so we re-query the DOM on every scroll event
 * until at least one header is found.
 *
 * Hidden when:
 *   - at the very top of the page (the hero is the focus)
 *   - no section header is yet above the reading line
 */
export default function ScrollSpy() {
  const [active, setActive] = useState<SectionMeta | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const compute = () => {
      ticking = false;
      const headers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-section-number]"),
      );
      if (headers.length === 0) return;

      const scrollY = window.scrollY;
      const readingLine = window.innerHeight * 0.33;

      // Don't show the pill until the user has scrolled past ~45% of the
      // viewport (the hero is the focus at the top).
      const hasScrolled = scrollY > window.innerHeight * 0.45;
      setVisible(hasScrolled);

      // Find the last header whose top is at or above the reading line —
      // that's the one the user is currently "in".
      let current: SectionMeta | null = null;
      for (const h of headers) {
        const rect = h.getBoundingClientRect();
        const top = rect.top + scrollY;
        if (scrollY + readingLine >= top) {
          current = {
            number: h.dataset.sectionNumber ?? "",
            eyebrow: h.dataset.sectionEyebrow ?? "",
          };
        }
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(compute);
      }
    };

    // Run a few times shortly after mount in case the main content is still
    // entering (it's behind a `entered` gate). Cheap and avoids the need for
    // a MutationObserver.
    const earlyPolls = [200, 600, 1200, 2000].map((ms) =>
      window.setTimeout(compute, ms),
    );

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      earlyPolls.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className={`scroll-spy-pill ${visible ? "visible" : ""}`}
      aria-hidden={!visible}
    >
      <span className="spy-badge">{active.number}</span>
      <span className="spy-dot" />
      <span className="truncate">{active.eyebrow}</span>
    </div>
  );
}
