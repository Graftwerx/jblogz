// components/system/ToastFromQuery.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type BannerType = "success" | "error" | "info" | "warning";

export default function ToastFromQuery({
  param = "banner",
  typeParam = "bannerType",
  defaultType = "success",
}: {
  param?: string;
  typeParam?: string;
  defaultType?: BannerType;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const msg = sp.get(param);
  const kind = (sp.get(typeParam) as BannerType) || defaultType;

  useEffect(() => {
    if (!msg) return;

    switch (kind) {
      case "error":
        toast.error(msg);
        break;
      case "warning":
        toast.warning(msg); // if not available
        break;
      case "info":
        toast.info(msg);
        break;
      default:
        toast.success(msg);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    url.searchParams.delete(typeParam);
    router.replace(url.pathname + (url.search ? "?" + url.search : ""), {
      scroll: false,
    });
  }, [msg, kind, param, typeParam, router]);

  return null;
}
