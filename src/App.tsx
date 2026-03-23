import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession } from "@/lib/auth";
import LoginPage from "@/app/page";
import CallbackPage from "@/app/auth/callback/page";
import SplashPage from "@/app/splash/page";
import DashboardPage from "@/app/dashboard/page";
import UploadPage from "@/app/upload/page";
import ChronologyPage from "@/app/chronology/page";
import VerificationPage from "@/app/verification/page";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route
          path="/splash"
          element={
            <ProtectedRoute>
              <SplashPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chronology"
          element={
            <ProtectedRoute>
              <ChronologyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <VerificationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
