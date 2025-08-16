// app/settings/account/ui/AccountForm.tsx
"use client";

import { useFormStatus } from "react-dom";

import { useActionState } from "react";
import { updateAccount } from "../action";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function AccountForm({
  initial,
}: {
  initial: {
    handle: string;
    name: string;
    image: string;
    bio: string;
    email?: string;
  };
}) {
  const [state, formAction] = useActionState(updateAccount, {
    ok: false as const,
  });

  return (
    <form action={formAction} className="space-y-6">
      {/* Email (read-only) */}
      {initial.email ? (
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            value={initial.email}
            disabled
            className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      {/* Handle */}
      <div>
        <label className="mb-1 block text-sm font-medium">Handle</label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">@</span>
          <input
            name="handle"
            defaultValue={initial.handle}
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9](?:[a-z0-9._]*[a-z0-9])?"
            placeholder="yourname"
            className="w-full rounded-md border px-3 py-2 text-sm"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          3–20 chars; letters/numbers, dots or underscores; must start & end
          with a letter/number.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          name="name"
          defaultValue={initial.name}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Display name"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium">Avatar URL</label>
        <input
          name="image"
          defaultValue={initial.image}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="https://…"
          inputMode="url"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1 block text-sm font-medium">Bio</label>
        <textarea
          name="bio"
          defaultValue={initial.bio}
          className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="A few words about you…"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SaveButton />
    </form>
  );
}
