import Image from "next/image";
import Link from "next/link";

interface IappProps {
  data: {
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
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
  const hasImage = !!data.imageUrl && data.imageUrl.trim() !== "";
  const hasVideo = !!data.videoUrl && data.videoUrl.trim() !== "";
  const hasAudio = !!data.audioUrl && data.audioUrl.trim() !== "";
  const hasAvatar = !!data.authorImage && data.authorImage.trim() !== "";

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md transition-all hover:shadow-lg">
      {/* MEDIA (not wrapped in Link so video/audio can play) */}
      <div className="relative h-64 w-full overflow-hidden">
        {hasImage ? (
          <Image
            src={data.imageUrl as string}
            alt={data.title || "blog image"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
        ) : hasVideo ? (
          <video
            src={data.videoUrl as string}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : hasAudio ? (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-zinc-100 p-4">
            <svg
              aria-hidden="true"
              className="mb-3 h-10 w-10 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <audio
              src={data.audioUrl as string}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-400">
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

      {/* CONTENT (clicking here navigates) */}
      <Link href={`/post/${data.id}`} className="block">
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
                    sizes="32px"
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
