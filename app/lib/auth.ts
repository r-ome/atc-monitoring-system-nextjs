import type { JWT } from "next-auth/jwt";
import {
  type SessionStrategy,
  type Session,
  type User,
  NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginController } from "src/controllers/users/login.controller";
import { InputParseError } from "src/entities/errors/common";

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

        console.log("AUTH email:", credentials?.username);
        console.log(
          "DB:",
          process.env.DATABASE_URL?.split("@")[1]?.split("?")[0]
        ); // host/db only

        console.log(
          "HASH meta:",
          credentials?.password?.slice(0, 7),
          credentials?.password?.length
        );
        const res = await LoginController(credentials);
        console.log("USER found:", res);
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
      session.user = {
        id: token.id,
        name: token.name,
        username: token.username,
        role: token.role,
        branch: token.branch,
      } as Session["user"];
      return session;
    },
  },
};
