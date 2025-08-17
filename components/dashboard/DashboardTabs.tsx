// components/dashboard/DashboardTabs.tsx  (SERVER component – no "use client")
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // this is a Client component; fine to render from server
import { BlogPostCard } from "@/components/general/BlogPostCard";
import Link from "next/link";
import type { BlogPostCardData } from "@/components/general/BlogPostCard";

type Activity = {
  notifications: Array<{
    id: string;
    createdAt: string | Date;
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
    createdAt: string | Date;
    follower: {
      id: string;
      name: string | null;
      image: string | null;
      handle: string | null;
    } | null;
  }>;
  myActions: Array<{
    id: string;
    createdAt: string | Date;
    post: { id: string; title: string | null } | null;
  }>;
};

export function DashboardTabs({
  myPosts,
  favoritesFeed,
  followingFeed,
  activity,
}: {
  myPosts: BlogPostCardData[];
  favoritesFeed: BlogPostCardData[];
  followingFeed: BlogPostCardData[];
  activity: Activity;
}) {
  return (
    <Tabs defaultValue="mine" className="w-full">
      <div className="mb-2 flex items-center justify-center gap-6">
        {/* <h2 className="text-2xl font-medium">dashboard</h2> */}
        <TabsList>
          <TabsTrigger className="text-2xl" value="mine">
            my blogs
          </TabsTrigger>
          <TabsTrigger className="text-2xl" value="activity">
            activity
          </TabsTrigger>
          <TabsTrigger className="text-2xl" value="favorites">
            favorites
          </TabsTrigger>
          <TabsTrigger className="text-2xl" value="following">
            following
          </TabsTrigger>
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
    </Tabs>
  );
}
