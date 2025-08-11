
// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Image upload
  postImage: f({
    image: {
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
  }).onUploadComplete(async ({ file }) => {
    // Must return a Promise payload
    return {
      url: file.url,
      mime: file.type,
      size: file.size,
    };
  }),

  // Video upload
  postVideo: f({
    video: {
      maxFileCount: 1,
      maxFileSize: "64MB",
    },
  }).onUploadComplete(async ({ file }) => {
    return {
      url: file.url,
      mime: file.type,
      size: file.size,
    };
  }),

  // Audio upload
  postAudio: f({
    audio: {
      maxFileCount: 1,
      maxFileSize: "32MB",
    },
  }).onUploadComplete(async ({ file }) => {
    return {
      url: file.url,
      mime: file.type,
      size: file.size,
    };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

