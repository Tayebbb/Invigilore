import { RouterProvider } from 'react-router';
import { router } from './routes';
import { StudentAccessProvider } from './context/StudentAccessContext';
import { AuthUserProvider } from './context/AuthUserContext';

export default function App() {
  return (
    <AuthUserProvider>
      <StudentAccessProvider>
        <RouterProvider router={router} />
      </StudentAccessProvider>
    </AuthUserProvider>
  );
}