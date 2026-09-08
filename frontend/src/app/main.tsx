import React, {useEffect,useState} from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, LayoutDashboard, Users, CalendarDays, ChartNoAxesCombined, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { AuthProvider, ProtectedRoute, Login, useAuth } from '../features/auth/Auth';
import { Settings } from '../features/auth/Settings';
import { Dashboard } from '../features/reportes/Dashboard';
import { Reports } from '../features/reportes/Reports';
import { Patients, NewPatient, PatientDetail } from '../features/pacientes/Patients';
import { NewAttention } from '../features/historia-clinica/Clinical';
import { NewTreatment } from '../features/tratamientos/Treatments';
import { Agenda } from '../features/agenda/Agenda';
import '../styles/index.css';
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
      refetchOnWindowFocus: true
    }
  }
});
const links = [['/dashboard', 'Inicio', LayoutDashboard], ['/pacientes', 'Pacientes', Users], ['/agenda', 'Agenda', CalendarDays], ['/reportes', 'Reportes', ChartNoAxesCombined], ['/configuracion', 'Configuración', SettingsIcon]] as const;
function Toast(){const location=useLocation();const [message,setMessage]=useState('');useEffect(()=>{setMessage(location.state?.message||'');const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer);},[location.key]);return message?<div className="toast" role="status">{message}</div>:null;}
function Layout() {
  const {
      logout
    } = useAuth(),
    location = useLocation();
  return <div className="shell"><aside className="sidebar"><NavLink className="brand" to="/dashboard"><Activity size={34} /><div>Juzel<small>CONSULTORIO ODONTOLÓGICO</small></div></NavLink><div className="nav-label">ESPACIO DE TRABAJO</div><nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to}><Icon size={20} />{label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="clinic-status"><i /> Consultorio Juzel<small>Chiclayo, Perú</small></div><button onClick={() => logout()}><LogOut size={18} />Cerrar sesión</button></div></aside><div className="main-shell"><header className="topbar"><span>{links.find(([to]) => location.pathname.startsWith(to))?.[1] || 'Historia clínica'}</span><div className="profile"><span className="avatar">OJ</span><div><strong>{localStorage.getItem('juzel-user') || 'Odontóloga'}</strong><small>Odontóloga · Juzel</small></div><button aria-label="Cerrar sesión" onClick={() => logout()}><LogOut size={18} /></button></div></header><main className="content"><Toast/><Outlet /></main><footer>Juzel · Gestión clínica y administrativa</footer></div></div>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={qc}><BrowserRouter><AuthProvider><Routes><Route path="/login" element={<Login />} /><Route element={<ProtectedRoute><Layout /></ProtectedRoute>}><Route path="/dashboard" element={<Dashboard />} /><Route path="/pacientes" element={<Patients />} /><Route path="/pacientes/nuevo" element={<NewPatient />} /><Route path="/pacientes/:id" element={<PatientDetail />} /><Route path="/pacientes/:id/atencion/nueva" element={<NewAttention />} /><Route path="/pacientes/:id/tratamientos/nuevo" element={<NewTreatment />} /><Route path="/agenda" element={<Agenda />} /><Route path="/reportes" element={<Reports />} /><Route path="/configuracion" element={<Settings />} /></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></AuthProvider></BrowserRouter></QueryClientProvider></React.StrictMode>);
