import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Phase from './pages/Phase';
import Lesson from './pages/Lesson';
import Project from './pages/Project';
import Gate from './pages/Gate';
import Practice from './pages/Practice';
import Sandbox from './pages/Sandbox';
import Interview from './pages/Interview';
import Glossary from './pages/Glossary';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/phase/:id" element={<Phase />} />
        <Route path="/lesson/:id" element={<Lesson />} />
        <Route path="/project/:phaseId" element={<Project />} />
        <Route path="/gate/:phaseId" element={<Gate />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
