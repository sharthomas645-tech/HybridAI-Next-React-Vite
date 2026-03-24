import { getSession } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import DashboardClient from "@/components/Dashboard";
import AuroraBackground from "@/components/AuroraBackground";

export default function DashboardPage() {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  return (
    <>
      <AuroraBackground />
      <DashboardClient user={{ username: session.username, email: session.email }} />
    </>
  );
}
