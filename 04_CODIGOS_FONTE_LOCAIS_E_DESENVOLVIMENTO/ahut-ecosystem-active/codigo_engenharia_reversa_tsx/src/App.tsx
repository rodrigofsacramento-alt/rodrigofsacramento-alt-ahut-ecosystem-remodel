import React, { useState, useEffect } from 'react';
import { useReminders } from './hooks/useReminders';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { Sidebar, Header } from './components/Layout';
import { AnimatePresence, motion } from 'framer-motion';
import NeuralBackground from './components/NeuralBackground';
import { useResponsive } from './hooks/useResponsive';
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Atendimento from './pages/Atendimento';
import Agenda from './components/Agenda';
import Properties from './components/Properties';
import Proposals from './components/Proposals';
import Contracts from './components/Contracts';
import Juridico from './components/Juridico';
import GestaoClientes from './components/GestaoClientes';
import ComissoesComercial from './components/Comissoes';
import Marketing from './components/Marketing';
import Treinamentos from './components/Treinamentos';
import TreinamentoAula from './components/TreinamentoAula';
import Gestao from './components/Gestao';
import Finance from './components/Finance';
import Tecnologia from './pages/Tecnologia';
import Notificacoes from './pages/Notificacoes';
import Vendas from './pages/Vendas';
import Login from './pages/Login';
import Corretores from './pages/Corretores';
import { Configuracoes } from './pages/Configuracoes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutos
      retry: 1
    }
  }
});

function AppLayout({ children, title, subtitle, dark }: { children: React.ReactNode; title: string; subtitle?: string; dark?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  useReminders();
  const useDark = dark !== false;
  const { isMobile } = useResponsive();

  // Auto-collapse sidebar on mobile
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  return (
    <div className={`flex min-h-screen relative ${useDark ? 'bg-transparent text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {useDark && <NeuralBackground />}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ zIndex: 5, background: 'transparent' }}>
        <Header title={title} subtitle={subtitle} />
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`p-6 flex-1 overflow-auto ${useDark ? 'bg-transparent' : ''}`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
        <Routes>
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Main App Routes */}
          <Route
            path="/"
            element={
              <AppLayout title="Dashboard" subtitle="Visão geral de desempenho imobiliário.">
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/leads"
            element={
              <AppLayout title="Leads" subtitle="Gerencie seus potenciais clientes.">
                <Leads />
              </AppLayout>
            }
          />
          <Route
            path="/atendimento"
            element={
              <AppLayout title="Central de Atendimento" subtitle="Chat em tempo real e integração com WhatsApp.">
                <Atendimento />
              </AppLayout>
            }
          />
          <Route
            path="/agenda"
            element={
              <AppLayout title="Agenda & Visitas" subtitle="Organize seus compromissos e visitas a imóveis.">
                <Agenda />
              </AppLayout>
            }
          />
          <Route
            path="/imoveis"
            element={
              <AppLayout title="Imóveis" subtitle="Catálogo completo de propriedades.">
                <Properties />
              </AppLayout>
            }
          />
          <Route
            path="/propostas"
            element={
              <AppLayout title="Propostas" subtitle="Acompanhamento e negociações ativas.">
                <Proposals />
              </AppLayout>
            }
          />
          <Route
            path="/contratos"
            element={
              <AppLayout title="Contratos" subtitle="Gestão de contratos e documentação jurídica.">
                <Contracts />
              </AppLayout>
            }
          />
          <Route
            path="/juridico"
            element={
              <AppLayout title="Jurídico & Contratos" subtitle="Processos jurídicos, validação de documentos e assinaturas.">
                <Juridico />
              </AppLayout>
            }
          />
          <Route
            path="/clientes"
            element={
              <AppLayout title="Gestão de Clientes" subtitle="Visualize e gerencie os clientes da imobiliária.">
                <GestaoClientes />
              </AppLayout>
            }
          />
          <Route
            path="/comissoes"
            element={
              <AppLayout title="Comissões" subtitle="Comissões de corretores, regras e câmbio.">
                <ComissoesComercial />
              </AppLayout>
            }
          />
          <Route
            path="/marketing"
            element={
              <AppLayout title="Marketing" subtitle="Postagens, mídias e engajamento.">
                <Marketing />
              </AppLayout>
            }
          />
          <Route
            path="/treinamentos"
            element={
              <AppLayout title="Treinamentos" subtitle="Curso de Neurovendas & capacitação da equipe.">
                <Treinamentos />
              </AppLayout>
            }
          />
          <Route
            path="/treinamentos/aula"
            element={
              <AppLayout title="Aula de Neurovendas" subtitle="Apresentação da aula — Christiane Racanelli.">
                <TreinamentoAula />
              </AppLayout>
            }
          />
          <Route
            path="/gestao"
            element={
              <AppLayout title="Painel de Gestão" subtitle="Gestão de tarefas e solicitações da Christiane Racanelli (Business Advisor).">
                <Gestao />
              </AppLayout>
            }
          />
          <Route
            path="/financeiro"
            element={
              <AppLayout title="Financeiro" subtitle="Fluxo de caixa, recebíveis e comissões.">
                <Finance />
              </AppLayout>
            }
          />
          <Route
            path="/vendas"
            element={
              <AppLayout title="Contratos e Vendas" subtitle="Acompanhe os contratos assinados e imóveis vendidos">
                <Vendas />
              </AppLayout>
            }
          />
          <Route
            path="/tecnologia"
            element={
              <AppLayout title="Squad de Tecnologia & Chamados" subtitle="Kanban de acompanhamento e triagem inteligente com Agente de IA." dark>
                <Tecnologia />
              </AppLayout>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <AppLayout title="Notificações" subtitle="Acompanhe seus alertas e autorizações.">
                <Notificacoes />
              </AppLayout>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <AppLayout title="Configurações" subtitle="Gerencie as preferências e segurança do sistema.">
                <Configuracoes />
              </AppLayout>
            }
          />
          <Route
            path="/corretores"
            element={
              <AppLayout title="Corretores & Equipe" subtitle="Gestão de usuários, metas e performance.">
                <Corretores />
              </AppLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
