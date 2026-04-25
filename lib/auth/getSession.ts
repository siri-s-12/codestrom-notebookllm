import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session }
}