
// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  postImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Add auth check here if needed:
      // const user = await auth();
      // if (!user) throw new Error("Unauthorized");
      return { userId: "some-user-id" };
    })
    .onUploadComplete(async ({ file }) => {
      // Return the uploaded file's URL for use in your form
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
