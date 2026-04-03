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
import { UserRepository } from "src/infrastructure/di/repositories";
import { isSessionExpired } from "./session-timeout";

type AuthStatus = "authenticated" | "unauthenticated" | "inactive";

type ValidatedSessionResult =
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated" | "inactive"; session: null };

const INACTIVE_LOGIN_URL = "/login?reason=inactive";

function redirectToLogin(
  status: Exclude<AuthStatus, "authenticated">,
): never {
  redirect(status === "inactive" ? INACTIVE_LOGIN_URL : "/login");
}

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
            cause: { credentials: ["Credentials is required!"] },
          });
        }
        const res = await LoginController(credentials);
        if (res.ok) {
          return {
            id: res.value.user_id,
            ...res.value,
            lastActivityAt: res.value.last_activity_at ?? null,
          };
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
        token.lastActivityAt = user.lastActivityAt ?? null;
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
      session.user.lastActivityAt = token.lastActivityAt ?? null;

      return session;
    },
  },
};

export const getValidatedSession = async (): Promise<ValidatedSessionResult> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.username) {
    return { status: "unauthenticated", session: null };
  }

  const user = await UserRepository.getUserByUsername(session.user.username);

  if (!user) {
    return { status: "unauthenticated", session: null };
  }

  if (isSessionExpired(user.last_activity_at)) {
    return { status: "inactive", session: null };
  }

  return {
    status: "authenticated",
    session: {
      ...session,
      user: {
        ...session.user,
        id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch: user.branch,
        lastActivityAt: user.last_activity_at?.toISOString() ?? null,
      },
    },
  };
};

export const getOptionalSession = async () => {
  const result = await getValidatedSession();

  return result.status === "authenticated" ? result.session : null;
};

export const requireSession = async (): Promise<Session> => {
  const result = await getValidatedSession();

  if (result.status !== "authenticated") {
    redirectToLogin(result.status);
  }

  return result.session;
};

export const requireUser = async () => {
  const session = await requireSession();
  return session.user;
};
