import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';

// Pages
import { Login } from './pages/Login.jsx';
import { Signup } from './pages/Signup.jsx';
import { Overview } from './pages/Overview.jsx';
import { Deployments } from './pages/Deployments.jsx';
import { ServerStatus } from './pages/ServerStatus.jsx';
import { Settings } from './pages/Settings.jsx';
import { NotFound } from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="overview" element={<Navigate to="/" replace />} />
              <Route path="deployments" element={<Deployments />} />
              <Route path="server-status" element={<ServerStatus />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
