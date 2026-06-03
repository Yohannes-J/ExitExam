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
import StudentFeedback from './pages/StudentFeedback';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';
import ExamForm from './pages/admin/ExamForm';
import AdminResults from './pages/admin/AdminResults';
import AdminStudents from './pages/admin/AdminStudents';
import AdminProfile from './pages/admin/AdminProfile';
import AdminReports from './pages/admin/AdminReports';
import AdminResultDetail from './pages/admin/AdminResultDetail';
import AdminSchools from './pages/admin/AdminSchools';
import AdminFeedback from './pages/admin/AdminFeedback';
import TeacherStudents from './pages/admin/TeacherStudents';
import StudentProfile from './pages/StudentProfile';

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
          {}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {}
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
          <Route path="/feedback" element={
            <ProtectedRoute>
              <Layout><StudentFeedback /></Layout>
            </ProtectedRoute>
          } />

          {}
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
          <Route path="/admin/results/:id" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminResultDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminStudents /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminProfile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminReports /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/schools" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminSchools /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/feedback" element={
            <ProtectedRoute adminOnly>
              <Layout><AdminFeedback /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/my-students" element={
            <ProtectedRoute adminOnly>
              <Layout><TeacherStudents /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><StudentProfile /></Layout>
            </ProtectedRoute>
          } />

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
