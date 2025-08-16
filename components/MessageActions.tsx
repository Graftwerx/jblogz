"use client";
import React from "react";
import { ShareButton } from "./ShareButton";
import { FavoriteButton } from "./FavoriteButton";

type CommonProps = {
  permalink: string;
  text?: string;
  initialIsFavorited?: boolean;
  favoriteCount?: number;
  isAuthenticated?: boolean;
  loginUrl?: string; // ← changed
  className?: string;
};

type IdProps = {
  postId?: string;
  messageId?: string;
  publicId?: string;
};

type Props = CommonProps & IdProps;

export function MessageActions({
  permalink,
  text,
  initialIsFavorited,
  favoriteCount,
  isAuthenticated,
  loginUrl, // ← changed
  className,
  postId,
  messageId,
  publicId,
}: Props) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <ShareButton
        variant="icon"
        data={{
          title: text ? text.slice(0, 80) : "Check this post",
          text,
          url: permalink,
        }}
      />
      <FavoriteButton
        postId={postId}
        messageId={messageId}
        publicId={publicId}
        initialIsFavorited={!!initialIsFavorited}
        count={favoriteCount ?? 0}
        isAuthenticated={!!isAuthenticated}
        loginUrl={loginUrl}
        showCount
      />
    </div>
  );
}
