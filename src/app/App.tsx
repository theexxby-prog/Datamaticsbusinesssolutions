import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CampaignThreadProvider } from './context/CampaignThreadContext';

// DatamaticsBPM Client Portal - Main App Component
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        {/* Above the router so a thread posted as the client is still there
            after switching to the campaign manager's view. */}
        <CampaignThreadProvider>
          <RouterProvider router={router} />
        </CampaignThreadProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}