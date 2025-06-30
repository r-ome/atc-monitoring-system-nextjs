import type { JWT } from "next-auth/jwt";
import NextAuth, {
  type SessionStrategy,
  type Session,
  type User,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginController } from "src/controllers/users/login.controller";
import { InputParseError } from "src/entities/errors/common";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username" },
        password: { label: "Password", type: "Password" },
      },
      async authorize(credentials, req) {
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
        ...session.user,
        id: token.id,
        name: token.name,
        username: token.username,
        role: token.role,
      } as Session["user"];
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
