"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function SearchBar({
  initialValue = "",
}: {
  initialValue?: string;
}) {
  const [value, setValue] = React.useState(initialValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Debounce URL updates so we don’t refetch on every keystroke
  React.useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(id);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="max-w-xl">
      <Input
        placeholder="Search by title, author, or keywords…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
