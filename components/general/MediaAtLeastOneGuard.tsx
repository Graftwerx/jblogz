"use client";

import * as React from "react";

export default function MediaAtLeastOneGuard({ formId }: { formId: string }) {
  React.useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const onSubmit = (e: Event) => {
      const imageUrl = (
        form.querySelector('input[name="imageUrl"]') as HTMLInputElement | null
      )?.value?.trim();
      const videoUrl = (
        form.querySelector('input[name="videoUrl"]') as HTMLInputElement | null
      )?.value?.trim();
      const audioUrl = (
        form.querySelector('input[name="audioUrl"]') as HTMLInputElement | null
      )?.value?.trim();

      if (!imageUrl && !videoUrl && !audioUrl) {
        e.preventDefault();
        alert("Please upload an image, video, or audio.");
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId]);

  return null;
}
