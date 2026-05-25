"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  hint: string;
  sectionLabel: string;
};

export function NavTooltip({ hint, sectionLabel }: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={wrapperRef} className="nav-tooltip-wrapper relative shrink-0">
      <button
        type="button"
        className="nav-tooltip-trigger flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 text-[10px] font-semibold leading-none text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        aria-label={`Подробнее о разделе ${sectionLabel}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        ?
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`nav-tooltip-content pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-52 max-w-[calc(14rem-1rem)] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-200 shadow-lg transition ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {hint}
      </div>
    </div>
  );
}
