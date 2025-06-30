import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { USER_ROLES } from "src/entities/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username?: string;
      role: USER_ROLES;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    role: USER_ROLES;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string;
    username?: string;
  }
}
