// components/dashboard/DashboardTabs.tsx
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import Link from "next/link";
import RequestActions from "@/components/messages/RequestActions";

// Match BlogPostCard's prop shape exactly (createdAt/updatedAt are Date)
type BlogPostCardData = {
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

type Activity = {
  notifications: Array<{
    id: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      handle: string | null;
    } | null;
    post: { id: string; title: string | null } | null;
  }>;
  newFollowers: Array<{
    id: string;
    createdAt: Date;
    follower: {
      id: string;
      name: string | null;
      image: string | null;
      handle: string | null;
    } | null;
  }>;
  myActions: Array<{
    id: string;
    createdAt: Date;
    post: { id: string; title: string | null } | null;
  }>;
};

type RequestItem = {
  id: string;
  createdAt: Date;
  fromUser: {
    id: string;
    handle: string | null;
    name: string | null;
    image: string | null;
  } | null;
};

type ConversationItem = {
  id: string;
  updatedAt: Date;
  participants: {
    user: {
      id: string;
      handle: string | null;
      name: string | null;
      image: string | null;
    };
  }[];
  messages: { id: string; body: string; createdAt: Date; senderId: string }[];
};

export function DashboardTabs({
  currentUserId,
  myPosts,
  favoritesFeed,
  followingFeed,
  activity,
  messages,
}: {
  currentUserId: string;
  myPosts: BlogPostCardData[];
  favoritesFeed: BlogPostCardData[];
  followingFeed: BlogPostCardData[];
  activity: Activity;
  messages: {
    pendingCount: number;
    requests: RequestItem[];
    conversations: ConversationItem[];
  };
}) {
  const MessagesLabel = (
    <span className="relative">
      messages
      {messages.pendingCount > 0 && (
        <span className="absolute -right-3 -top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
          {messages.pendingCount}
        </span>
      )}
    </span>
  );

  return (
    <Tabs defaultValue="mine" className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-2xl font-medium">dashboard</h2>
        <TabsList>
          <TabsTrigger value="mine">my blogs</TabsTrigger>
          <TabsTrigger value="activity">activity</TabsTrigger>
          <TabsTrigger value="favorites">favorites</TabsTrigger>
          <TabsTrigger value="following">following</TabsTrigger>
          <TabsTrigger value="messages">{MessagesLabel}</TabsTrigger>
        </TabsList>
      </div>

      {/* My Blogs */}
      <TabsContent value="mine" className="mt-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myPosts.map((item) => (
            <BlogPostCard data={item} key={item.id} />
          ))}
          {myPosts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You haven’t published anything yet.
            </p>
          )}
        </section>
      </TabsContent>

      {/* Activity */}
      <TabsContent value="activity" className="mt-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              notifications (on your posts)
            </h3>
            <ul className="space-y-3">
              {activity.notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {n.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.user.image}
                      alt={n.user.name || ""}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  )}
                  <div className="text-sm">
                    <span className="font-medium">
                      {n.user?.name || n.user?.handle || "Someone"}
                    </span>
                    <span> favorited your post </span>
                    {n.post && (
                      <Link href={`/post/${n.post.id}`} className="underline">
                        {n.post.title || "(untitled)"}
                      </Link>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
              {activity.notifications.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              new followers
            </h3>
            <ul className="space-y-3">
              {activity.newFollowers.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {f.follower?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.follower.image}
                      alt={f.follower.name || ""}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  )}
                  <div className="text-sm">
                    <span className="font-medium">
                      {f.follower?.name || f.follower?.handle || "Someone"}
                    </span>
                    <span> started following you</span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
              {activity.newFollowers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No new followers yet.
                </p>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            your recent actions
          </h3>
          <ul className="space-y-3">
            {activity.myActions.map((a) => (
              <li key={a.id} className="rounded-lg border p-3 text-sm">
                You favorited{" "}
                <Link className="underline" href={`/post/${a.post?.id}`}>
                  {a.post?.title || "(untitled)"}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
            {activity.myActions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent activity.
              </p>
            )}
          </ul>
        </div>
      </TabsContent>

      {/* Favorites Feed */}
      <TabsContent value="favorites" className="mt-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favoritesFeed.map((item) => (
            <BlogPostCard data={item} key={item.id} />
          ))}
          {favoritesFeed.length === 0 && (
            <p className="text-sm text-muted-foreground">No favorites yet.</p>
          )}
        </section>
      </TabsContent>

      {/* Following Feed */}
      <TabsContent value="following" className="mt-4">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followingFeed.map((item) => (
            <BlogPostCard data={item} key={item.id} />
          ))}
          {followingFeed.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No posts from accounts you follow yet.
            </p>
          )}
        </section>
      </TabsContent>

      {/* Messages */}
      <TabsContent value="messages" className="mt-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Requests */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              requests
            </h3>
            <ul className="space-y-3">
              {messages.requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {r.fromUser?.name ||
                        (r.fromUser?.handle
                          ? `@${r.fromUser.handle}`
                          : "Unknown")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      sent {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <RequestActions requestId={r.id} />
                </li>
              ))}
              {messages.requests.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending requests.
                </p>
              )}
            </ul>
          </div>

          {/* Conversations */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              conversations
            </h3>
            <ul className="space-y-3">
              {messages.conversations.map((c) => {
                const others = c.participants
                  .map((p) => p.user)
                  .filter((u) => u.id !== currentUserId);
                const other = others[0] ?? c.participants[0]?.user ?? null;
                const last = c.messages[0] ?? null;
                return (
                  <li key={c.id} className="rounded border p-3">
                    <Link
                      href={`/messages/${c.id}`}
                      className="block hover:underline"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {other?.name ||
                            (other?.handle
                              ? `@${other.handle}`
                              : "Conversation")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      {last && (
                        <div className="mt-1 truncate text-sm text-muted-foreground">
                          {last.body}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
              {messages.conversations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No conversations yet.
                </p>
              )}
            </ul>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
