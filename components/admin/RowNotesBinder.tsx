// components/admin/RowNotesBinder.tsx
"use client";

import { useEffect } from "react";

/** Mirrors the value from the visible notes input into all hidden inputs with data-note-for=rowId */
export default function RowNotesBinder({ rowId }: { rowId: string }) {
  useEffect(() => {
    const source = document.querySelector<HTMLInputElement>(
      `[data-note-source="${rowId}"]`
    );
    if (!source) return;

    const sync = () => {
      const targets = document.querySelectorAll<HTMLInputElement>(
        `[data-note-for="${rowId}"]`
      );
      targets.forEach((t) => {
        t.value = source.value;
      });
    };

    // initial and on input
    sync();
    source.addEventListener("input", sync);
    return () => {
      source.removeEventListener("input", sync);
    };
  }, [rowId]);

  return null;
}
