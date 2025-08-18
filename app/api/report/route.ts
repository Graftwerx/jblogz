// app/api/report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ReportReason, ReportTargetType } from "@prisma/client";

type ReportPayload = {
  targetType: ReportTargetType; // "POST" | "COMMENT" | "MESSAGE" | "USER"
  targetId: string;
  reason: ReportReason;         // enum from schema
  details?: string;
};

type ReportCreateShape = {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
  postId?: string;
  commentId?: string;
  messageId?: string;
  userId?: string;
};

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json()) as Partial<ReportPayload>;
  const { targetType, targetId, reason } = body;

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // normalize details length
  const details = (body.details ?? "").slice(0, 2000);

  // base create shape (no any)
  const createData: ReportCreateShape = {
    reporterId: user.id,
    targetType,
    targetId,
    reason,
    details,
  };

  // verify target exists and set the specific FK field
  switch (targetType) {
    case "POST": {
      const exists = await prisma.blogPost.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      createData.postId = targetId;
      break;
    }
    case "COMMENT": {
      const exists = await prisma.comment.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      createData.commentId = targetId;
      break;
    }
    case "MESSAGE": {
      const exists = await prisma.message.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      createData.messageId = targetId;
      break;
    }
    case "USER": {
      const exists = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      createData.userId = targetId;
      break;
    }
    default: {
      // satisfies the type system; should never hit due to enum typing
      return NextResponse.json({ ok: false, error: "unsupported_target" }, { status: 400 });
    }
  }

  // one report per reporter per target
  const report = await prisma.report.upsert({
    where: {
      report_one_per_user_target: {
        reporterId: user.id,
        targetType,
        targetId,
      },
    },
    update: {
      reason,
      details,
      status: "OPEN",
    },
    create: createData,
    select: { id: true },
  });

  return NextResponse.json({ ok: true, reportId: report.id });
}
