"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export const LogoutButton = () => (
  <div
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="cursor-pointer hover:underline text-lg flex items-center gap-2 px-1"
  >
    <LogOut className="size-5" />
    Logout
  </div>
);
