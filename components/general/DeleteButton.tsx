"use client";

import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={cn(buttonVariants({ variant: "destructive" }))}
      disabled={pending}
      onClick={(e) => {
        if (
          !confirm(
            "Are you sure you want to delete this post? This cannot be undone."
          )
        ) {
          e.preventDefault(); // cancel form submit
        }
      }}
    >
      {pending ? "deleting..." : "delete"}
    </button>
  );
}
