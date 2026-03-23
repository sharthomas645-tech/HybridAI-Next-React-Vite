import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuroraBackground from "@/components/AuroraBackground";
import Header from "@/components/Header";
import ChronologyClient from "./ChronologyClient";

export default async function ChronologyPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <>
      <AuroraBackground />
      <Header user={{ username: session.username, email: session.email }} />
      <main
        style={{
          position: "relative",
          zIndex: 10,
          padding: "2rem 1.25rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          className="gradient-text-inline"
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}
        >
          Build Chronology
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            marginBottom: "2rem",
          }}
        >
          Select an uploaded case document to generate a medical chronology timeline.
        </p>
        <ChronologyClient />
      </main>
    </>
  );
}
