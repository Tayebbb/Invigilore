import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { StudentAccessProvider } from './context/StudentAccessContext';
import { AuthUserProvider } from './context/AuthUserContext';
import { syncWithServer } from './utils/timeSync';

export default function App() {
  useEffect(() => {
    void syncWithServer();
  }, []);

  return (
    <AuthUserProvider>
      <StudentAccessProvider>
        <RouterProvider router={router} />
      </StudentAccessProvider>
    </AuthUserProvider>
  );
}