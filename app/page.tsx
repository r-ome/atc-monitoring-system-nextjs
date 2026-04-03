import { redirect } from "next/navigation";
import { getOptionalSession } from "./lib/auth";

export default async function Home() {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/login");
  } else {
    redirect("/home");
  }
}
