import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { deletePost } from "@/app/actions";
import { DeleteButton } from "@/components/general/DeleteButton";

async function getData(id: string) {
  const data = await prisma.blogPost.findUnique({
    where: { id },
  });
  if (!data) {
    return null;
  }
  return data;
}

type Params = Promise<{ id: string }>;

export default async function page({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) {
    return notFound();
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const isAuthor = !!user && user.id === data.authorId;

  async function onDelete() {
    "use server";
    return deletePost(id);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between">
        <Link
          href={"/"}
          className={buttonVariants({
            variant: "secondary",
          })}
        >
          back to posts
        </Link>

        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/post/${id}/edit`}
              className={buttonVariants({ variant: "default" })}
            >
              edit
            </Link>
            <form action={onDelete}>
              <DeleteButton />
            </form>
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 px-6 py-4">
            {data.authorImage && (
              <Image
                src={data.authorImage}
                alt={data.authorName}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{data.authorName}</span>
              <span className="text-sm text-gray-500">
                {new Date(data.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {data.imageUrl && (
            <div className="relative h-64 w-full">
              <Image
                src={data.imageUrl}
                alt={data.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="px-6 py-4">
            <h1 className="mb-4 text-2xl font-bold">{data.title}</h1>
            <p className="whitespace-pre-line">{data.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
