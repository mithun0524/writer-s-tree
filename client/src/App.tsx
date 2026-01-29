import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
// Temporarily disabled Clerk auth for testing
// import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
            path="/dashboard"
            element={<Dashboard />}
        />
        <Route
            path="/editor/:projectId"
            element={<Layout />}
        />
        <Route
            path="/project/:id"
            element={<Layout />}
        />
        {/* Temporarily disabled auth routes */}
        {/*
        <Route
           path="/sign-in/*"
           element={<div className="flex items-center justify-center h-screen bg-background-secondary"><SignIn routing="path" path="/sign-in" /></div>}
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center h-screen bg-background-secondary">
              <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />
        */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
