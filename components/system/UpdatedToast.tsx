"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function UpdatedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const updated = searchParams.get("updated");

  useEffect(() => {
    if (!updated) return;

    toast.success("Profile updated successfully!");

    // Clean just the ?updated param from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("updated");
    router.replace(url.pathname + (url.search ? "?" + url.search : ""), {
      scroll: false,
    });
  }, [updated, router]);

  return null;
}
