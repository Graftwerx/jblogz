import Image from "next/image";
import Link from "next/link";

interface IappProps {
  data: {
    id: string;
    title: string;
    content: string;
    imageUrl: string; // may be ""
    authorId: string;
    authorName: string;
    authorImage: string; // may be ""
    createdAt: Date;
    updatedAt: Date;
  };
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "•"
  );
}

export function BlogPostCard({ data }: IappProps) {
  const hasCover = !!data.imageUrl && data.imageUrl.trim() !== "";
  const hasAvatar = !!data.authorImage && data.authorImage.trim() !== "";

  return (
    <div className="group relative overflow-hidden rounded-lg border-zinc-200 bg-white shadow-md transition-all hover:shadow-lg">
      <Link href={`/post/${data.id}`} className="block h-full w-full">
        <div className="relative h-64 w-full overflow-hidden">
          {hasCover ? (
            <Image
              src={data.imageUrl}
              alt={data.title || "blog image"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-400">
              {/* simple camera/image icon */}
              <svg
                aria-hidden="true"
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.75" />
                <path d="M21 15l-4.5-4.5L9 18" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-zinc-900">
            {data.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-zinc-600">
            {data.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative size-8 overflow-hidden rounded-full">
                {hasAvatar ? (
                  <Image
                    src={data.authorImage}
                    alt={data.authorName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-[10px] font-semibold text-zinc-700">
                    {initials(data.authorName)}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-700">
                {data.authorName}
              </p>
            </div>

            <time className="text-xs text-zinc-500">
              {new Intl.DateTimeFormat("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(data.createdAt)}
            </time>
          </div>
        </div>
      </Link>
    </div>
  );
}
