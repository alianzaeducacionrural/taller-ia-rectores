import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Bienvenida from './pages/Bienvenida';
import PaginaRector from './pages/PaginaRector';
import PanelFacilitador from './pages/PanelFacilitador';
import TallerRector from './pages/TallerRector';
import VistaGeneral from './pages/VistaGeneral';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Bienvenida />} />
        <Route path="/rector/:slug" element={<PaginaRector />} />
        <Route path="/general" element={<VistaGeneral />} />
        <Route path="/taller" element={<TallerRector />} />
        <Route path="/panel-facilitador" element={<PanelFacilitador />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
