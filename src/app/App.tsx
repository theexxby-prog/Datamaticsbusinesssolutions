import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CampaignThreadProvider } from './context/CampaignThreadContext';
import { ThemeProvider } from './context/ThemeContext';

// DatamaticsBPM Client Portal - Main App Component
export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        {/* Above the router so a thread posted as the client is still there
            after switching to the campaign manager's view. */}
        <CampaignThreadProvider>
          <RouterProvider router={router} />
          {/* Inverse-surface toast chrome so it contrasts in both themes */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface-inverse)',
                color: 'var(--color-text-inverse)',
                border: 'none',
              },
            }}
          />
        </CampaignThreadProvider>
      </NotificationProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}