import { type SessionStrategy, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginController } from "src/controllers/users/login.controller";
import { InputParseError } from "src/entities/errors/common";
import { USER_ROLES } from "src/entities/models/User";

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
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        const branches = (user as any).branches as
          | { branch_id: string; name: string }[]
          | undefined;
        token.branches = branches ?? [];
      }

      // Safety: ensure array exists
      if (!token.branches) token.branches = [];
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        username: token.username as string,
        role: token.role as USER_ROLES,
        branches: token.branches ?? [],
      };
      return session;
    },
  },
};
