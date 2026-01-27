import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
            path="/dashboard"
            element={
                <>
                <SignedIn>
                    <Dashboard />
                </SignedIn>
                <SignedOut>
                    <RedirectToSignIn />
                </SignedOut>
                </>
            }
        />
        <Route
            path="/project/:id"
            element={
                <>
                <SignedIn>
                    <Layout />
                </SignedIn>
                <SignedOut>
                    <RedirectToSignIn />
                </SignedOut>
                </>
            }
        />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
