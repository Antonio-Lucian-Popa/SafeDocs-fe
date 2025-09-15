import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import DocumentDetails from '@/pages/DocumentDetails';
import ExpiringSoon from '@/pages/ExpiringSoon';
import { FolderRoute } from '@/pages/FolderRoute';
import DocumentViewer from '@/pages/DocumentViewer';


export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/doc/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <DocumentDetails />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/folders/:folderId" element={<FolderRoute />} />

      <Route path="/documents/:id/view" element={<DocumentViewer />} />


      <Route path="/expiring-soon" element={
        <ProtectedRoute>
          <AppLayout>
            <ExpiringSoon />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}