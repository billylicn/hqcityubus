import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PwaRegister } from './components/pwa-register';
import { HomePage, SchedulePage } from './pages';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const page = document.body.dataset.page;

createRoot(root).render(
  <StrictMode>
    {page === 'schedule' ? <SchedulePage /> : <HomePage />}
    <PwaRegister />
  </StrictMode>,
);
