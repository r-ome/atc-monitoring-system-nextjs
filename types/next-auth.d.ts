import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "src/entities/models/User";

type Branch = {
  branch_id: string;
  name: string;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string;
      role: UserRole;
      branch: Branch;
      lastActivityAt?: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    role: UserRole;
    branch: Branch;
    lastActivityAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: UserRole;
    branch?: Branch;
    lastActivityAt?: string | null;
  }
}
