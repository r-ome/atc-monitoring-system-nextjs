import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session || !allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized"); // or redirect
  }

  return session;
}
