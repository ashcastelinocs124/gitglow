import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setFeaturedProjectIds } from "@/lib/store";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const ids = body.featuredProjectIds;

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "featuredProjectIds must be an array" }, { status: 400 });
  }

  setFeaturedProjectIds(session.user.email, ids);

  return NextResponse.json({ success: true });
}
