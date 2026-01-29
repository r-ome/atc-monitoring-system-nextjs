import { DefaultSession, DefaultUser } from "next-auth";
import { USER_ROLES } from "src/entities/models/User";

type Branch = {
  branch_id: string;
  name: string;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string;
      role: USER_ROLES;
      branch: Branch;
    };
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    role: USER_ROLES;
    branch: Branch;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: USER_ROLES;
    branch?: Branch;
  }
}
