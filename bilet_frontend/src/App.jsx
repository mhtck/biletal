import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./lib/context/AuthContext";
import ProtectedRoute from "./lib/routes/ProtectedRoute";
import PublicRoute from "./lib/routes/PublicRoute";

import HomePage from "./lib/pages/visitor/HomePage";
import LoginPage from "./lib/pages/visitor/LoginPage";
import RegisterPage from "./lib/pages/visitor/RegisterPage";

import { Button } from "./components/ui/button";
import Ticket from "./lib/pages/member/Ticket";
import { Toaster } from "react-hot-toast";
import { Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { tokenHandler } from "./lib/utils/tokenHandler";
import { checkAuthStatus } from "./lib/redux/authSlice";
import ErrorBoundary from "./lib/routes/ErrorBoundary";
import TripPage from "./lib/pages/visitor/TripPage";
import LayoutComponent from "./lib/pages/layout/layout";
import BusBookingApp from "./lib/pages/visitor/BookingApp";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const token = tokenHandler.getToken();
    if (token) {
      dispatch(checkAuthStatus()).finally(() => setInitialCheckDone(true));
    } else {
      setInitialCheckDone(true);
    }
  }, [dispatch]);

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: "10px",
          },
          success: {
            duration: 5000,
            theme: {
              primary: "#4aed88",
            },
          },
          error: {
            duration: 5000,
            theme: {
              primary: "#ff4b4b",
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LayoutComponent >
                  <HomePage/>
                </LayoutComponent>
              </PublicRoute>
            }
          />
          <Route
            path="/trip"
            element={
              <PublicRoute>
                <LayoutComponent>
                  <BusBookingApp />
                </LayoutComponent>
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Route */}
          <Route
            path="/ticket"
            element={
              <ProtectedRoute>
                <Ticket />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
