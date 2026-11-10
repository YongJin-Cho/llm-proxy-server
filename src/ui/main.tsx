import { createRoot } from 'react-dom/client';
import { TrafficPage } from './pages/TrafficPage';
import { UiErrorBoundary } from './components/UiErrorBoundary';
import './styles.css';

createRoot(document.getElementById('root')!).render(<UiErrorBoundary><TrafficPage /></UiErrorBoundary>);
