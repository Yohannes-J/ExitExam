import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SessionManager from './components/SessionManager';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import Results from './pages/Results';
import ResultDetail from './pages/ResultDetail';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';
import ExamForm from './pages/admin/ExamForm';
import AdminResults from './pages/admin/AdminResults';
import AdminStudents from './pages/admin/AdminStudents';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <SessionManager />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/exam/:id" element={
            <ProtectedRoute>
              <ExamPage />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute>
              <Layout><Results /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/results/:id" element={
            <ProtectedRoute>
              <Layout><ResultDetail /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/exams" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminExams /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/exams/new" element={
            <ProtectedRoute adminOnly>
              <Layout><ExamForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/exams/:id/edit" element={
            <ProtectedRoute adminOnly>
              <Layout><ExamForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/results" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminResults /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminStudents /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
