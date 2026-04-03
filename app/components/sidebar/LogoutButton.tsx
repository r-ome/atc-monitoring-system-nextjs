"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { logSessionLogout } from "@/app/(protected)/session-actions";

export const LogoutButton = () => {
  const handleLogout = async () => {
    await logSessionLogout("manual");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      onClick={() => void handleLogout()}
      className="cursor-pointer hover:underline text-lg flex items-center gap-2 px-1"
    >
      <LogOut className="size-5" />
      Logout
    </div>
  );
};
