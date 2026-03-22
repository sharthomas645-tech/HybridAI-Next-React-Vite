import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import FileUploadClient from "@/components/FileUpload";
import AuroraBackground from "@/components/AuroraBackground";
import Header from "@/components/Header";

export default async function UploadPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <>
      <AuroraBackground />
      <Header user={{ username: session.username, email: session.email }} />
      <main style={{ position: "relative", zIndex: 10, padding: "2rem 1.25rem", maxWidth: "800px", margin: "0 auto" }}>
        <h1 className="gradient-text-inline" style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          PHI File Upload
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2rem" }}>
          Upload protected health information files securely to AWS S3.
        </p>
        <FileUploadClient userEmail={session.email} />
      </main>
    </>
  );
}
