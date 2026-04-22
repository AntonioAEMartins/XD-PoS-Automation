"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type GlassSection = {
  id: string;
  label: string;
  number: string;
};

type Props = {
  sections: GlassSection[];
};

const SCROLL_OFFSET = 64;
const TRAVEL_SAFETY_MS = 1200;
const TRAVEL_IDLE_MS = 180;

export function LiquidGlassSelector({ sections }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number }>({
    top: 0,
    height: 0
  });
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);

  const isExpanded = isHovered || isFocused || isTraveling;

  const activeIndex = useMemo(
    () => Math.max(0, sections.findIndex(s => s.id === activeId)),
    [sections, activeId]
  );

  const measureIndicator = useCallback(() => {
    const container = containerRef.current;
    const btn = buttonRefs.current[sections[activeIndex]?.id ?? ""];
    if (!container || !btn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      top: btnRect.top - containerRect.top,
      height: btnRect.height
    });
  }, [sections, activeIndex]);

  useEffect(() => {
    measureIndicator();
    setMounted(true);
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Track which sections are visible and pick the one whose top
    // is closest to the 1/3 mark of the viewport. This gives a stable
    // "you are here" feel even when two sections overlap.
    const handler = () => {
      const anchor = window.innerHeight * 0.33;
      let bestId = elements[0].id;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - anchor);
        if (rect.bottom > 0 && rect.top < window.innerHeight && distance < bestDistance) {
          bestDistance = distance;
          bestId = el.id;
        }
      }
      setActiveId(bestId);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [sections]);

  // While traveling (programmatic smooth scroll after a click), keep the pill
  // expanded until the scroll settles, then collapse it.
  useEffect(() => {
    if (!isTraveling) return;

    let idleTimer: number | null = null;
    const finish = () => {
      // Drop focus from the clicked button so the pill shrinks back to its
      // compact state once we've arrived at the new section.
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        containerRef.current?.contains(active)
      ) {
        active.blur();
      }
      setIsTraveling(false);
    };
    const resetIdleTimer = () => {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(finish, TRAVEL_IDLE_MS);
    };

    const hasScrollEnd = "onscrollend" in window;
    if (hasScrollEnd) {
      window.addEventListener("scrollend", finish);
    } else {
      window.addEventListener("scroll", resetIdleTimer, { passive: true });
      resetIdleTimer();
    }

    const safetyTimer = window.setTimeout(finish, TRAVEL_SAFETY_MS);

    return () => {
      if (hasScrollEnd) {
        window.removeEventListener("scrollend", finish);
      } else {
        window.removeEventListener("scroll", resetIdleTimer);
      }
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [isTraveling]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    if (Math.abs(top - window.scrollY) < 2) return;
    setIsTraveling(true);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Page sections"
      className="pointer-events-none fixed inset-y-0 left-3 z-40 hidden items-center sm:left-5 sm:flex"
    >
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setIsFocused(false);
          }
        }}
        className="glass pointer-events-auto relative flex flex-col gap-1 rounded-2xl p-1.5"
      >
        {/* Sliding glass indicator behind the active item */}
        <div
          className="glass-inner pointer-events-none absolute left-1.5 right-1.5 rounded-xl"
          style={{
            top: indicator.top,
            height: indicator.height,
            transition: mounted
              ? "top 360ms cubic-bezier(0.22, 1, 0.36, 1), height 360ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
            willChange: "top, height"
          }}
          aria-hidden
        />
        {sections.map(section => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              ref={el => {
                buttonRefs.current[section.id] = el;
              }}
              type="button"
              onClick={() => scrollTo(section.id)}
              aria-current={isActive ? "true" : undefined}
              className="relative z-10 flex items-center rounded-xl px-3 py-2.5 text-left transition-colors duration-200"
            >
              <span
                className={`mono text-[10px] tabular-nums tracking-[0.18em] transition-colors duration-200 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {section.number}
              </span>
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.22,_1,_0.36,_1)] ${
                  isExpanded ? "ml-3 max-w-[12rem] opacity-100" : "ml-0 max-w-0 opacity-0"
                }`}
              >
                <span
                  className={`text-[13px] font-medium tracking-tight transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {section.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
