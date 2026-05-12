import { requireSession } from "@/app/lib/auth";
import { format } from "date-fns";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export async function HomeHero() {
  const session = await requireSession();
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight">
        {greeting()}, {firstName}
      </h1>
      <p className="mt-0.5 text-[13.5px] text-muted-foreground">{today}</p>
    </div>
  );
}
