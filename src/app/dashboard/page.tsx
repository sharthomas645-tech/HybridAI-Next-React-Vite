import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardClient from "@/components/Dashboard";
import AuroraBackground from "@/components/AuroraBackground";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <>
      <AuroraBackground />
      <DashboardClient user={{ username: session.username, email: session.email }} />
    </>
  );
}
