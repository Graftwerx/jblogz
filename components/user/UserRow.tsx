import Image from "next/image";
import Link from "next/link";

export default function UserRow({
  handle,
  name,
  image,
}: {
  handle: string;
  name?: string | null;
  image?: string | null;
}) {
  return (
    <Link
      href={`/u/${handle}`}
      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
    >
      {image ? (
        <Image
          src={image}
          alt={handle}
          width={36}
          height={36}
          className="rounded-full"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-muted" />
      )}
      <div className="leading-tight">
        <div className="font-medium">@{handle}</div>
        {name ? (
          <div className="text-xs text-muted-foreground">{name}</div>
        ) : null}
      </div>
    </Link>
  );
}
