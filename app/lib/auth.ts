import type { JWT } from "next-auth/jwt";
import {
  type SessionStrategy,
  type Session,
  type User,
  NextAuthOptions,
  getServerSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginController } from "src/controllers/users/login.controller";
import { InputParseError } from "src/entities/errors/common";
import { redirect } from "next/navigation";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username" },
        password: { label: "Password", type: "Password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new InputParseError("Invalid Data!", {
            cause: "Credentials is required!",
          });
        }
        const res = await LoginController(credentials);
        if (res.ok) {
          return { id: res.value.user_id, ...res.value };
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.name = user.username;
        token.username = user.username;
        token.role = user.role;
        token.branch = {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        };
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token.id) session.user.id = token.id;

      if (typeof token.name === "string") session.user.name = token.name;
      if (token.username) session.user.username = token.username;

      if (token.role) session.user.role = token.role;
      if (token.branch) session.user.branch = token.branch;

      return session;
    },
  },
};

export const requireUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session.user;
};
