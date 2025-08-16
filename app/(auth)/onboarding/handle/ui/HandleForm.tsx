"use client";

import { useFormStatus } from "react-dom";
import { setHandle } from "../action";
import { useActionState } from "react";

const initialState = {
  ok: false as const,
  error: undefined as string | undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save handle"}
    </button>
  );
}

export default function HandleForm({ returnTo }: { returnTo: string }) {
  const [state, formAction] = useActionState(setHandle, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label className="mb-1 block text-sm font-medium">Handle</label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">@</span>
          <input
            name="handle"
            required
            minLength={3}
            maxLength={20}
            // must start and end with a letter/number; allow dots/underscores in the middle
            inputMode="text"
            pattern="[a-z0-9](?:[a-z0-9._]*[a-z0-9])?"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="kinglouie"
            className="w-full rounded-md border px-3 py-2"
            title="3–20 chars; letters/numbers, dots or underscores; must start and end with a letter/number."
          />
        </div>
        {state?.error && (
          <p className="mt-2 text-sm text-red-600">{state.error}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
