import { BrowserRouter } from 'react-router-dom';
import { PromptHubProvider } from './hooks/PromptHubContext';
import AppRoutes from './routes/AppRoutes';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <PromptHubProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PromptHubProvider>
    </ErrorBoundary>
  );
}
