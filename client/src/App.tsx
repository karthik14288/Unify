import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LensProvider } from './hooks/useLens';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IngestPage } from './pages/IngestPage';
import { ChatPage } from './pages/ChatPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LensProvider>
          <Routes>
            {/* Public Landing & Authentication */}
            <Route path="/" element={<LandingPage />} />

            {/* Protected Workspace Layout */}
            <Route
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ingest" element={<IngestPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LensProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
