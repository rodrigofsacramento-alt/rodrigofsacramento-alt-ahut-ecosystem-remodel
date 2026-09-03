import React, { useState, useEffect } from 'react';
import { useReminders } from './hooks/useReminders';
import AuthProvider from './contexts/AuthProvider';
import FinancialFiltersProvider from './contexts/FinancialFiltersContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { Sidebar, Header } from './components/Layout';
import { AnimatePresence, motion } from 'framer-motion';
import NeuralBackground from './components/NeuralBackground';
import { useResponsive } from './hooks/useResponsive';
import ProtectedRoute from './components/ProtectedRoute';
import RouteErrorBoundary from './components/RouteErrorBoundary';
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
const FinancialDashboard = React.lazy(() => import('./pages/financeiro/DashboardFinanceiro'));
const FinancialLancamentos = React.lazy(() => import('./pages/financeiro/Lancamentos'));
const FinancialBancos = React.lazy(() => import('./pages/financeiro/Bancos'));
const FinancialCartoes = React.lazy(() => import('./pages/financeiro/Cartoes'));
const FinancialTransferencias = React.lazy(() => import('./pages/financeiro/Transferencias'));
const FinancialCategorias = React.lazy(() => import('./pages/financeiro/Categorias'));
import Tecnologia from './pages/Tecnologia';
import Notificacoes from './pages/Notificacoes';
import Vendas from './pages/Vendas';
import Login from './pages/Login';
import Corretores from './pages/Corretores';
const PerformanceFunil = React.lazy(() => import('./pages/PerformanceFunil'));
import { Configuracoes } from './pages/Configuracoes';
import ImageEditor from './components/ImageEditor';
import WhatsAppConnectionModal from './components/WhatsAppConnectionModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutos
      retry: 1
    }
  }
});

function AppLayout({ children, title, subtitle, dark, onOpenWhatsApp }: { children: React.ReactNode; title: string; subtitle?: string; dark?: boolean; onOpenWhatsApp?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  useReminders();
  const useDark = dark !== false;
  const { isMobile } = useResponsive();

  // Auto-collapse sidebar on mobile
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  return (
    <div className={`flex min-h-screen relative ${useDark ? 'bg-transparent text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {useDark && <NeuralBackground />}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onOpenWhatsApp={onOpenWhatsApp} />
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ zIndex: 1 }}>
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

function ProtectedAppLayout(props: any) {
  return (
    <ProtectedRoute>
      <AppLayout {...props} />
    </ProtectedRoute>
  );
}

export default function App() {
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <FinancialFiltersProvider>
          <Router>
          <RouteErrorBoundary>
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#06080e] text-slate-400 text-sm">Carregando...</div>}>
          <Routes>
            {/* Auth Route - public */}
            <Route path="/login" element={<Login />} />

            {/* Main App Routes - protected */}
            <Route
              path="/"
              element={
                <ProtectedAppLayout title="Dashboard" subtitle="Visão geral de desempenho imobiliário." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Dashboard />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedAppLayout title="Leads" subtitle="Gerencie seus potenciais clientes." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Leads />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/atendimento"
              element={
                <ProtectedAppLayout title="Central de Atendimento" subtitle="Chat em tempo real e integração com WhatsApp." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Atendimento />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/agenda"
              element={
                <ProtectedAppLayout title="Agenda & Visitas" subtitle="Organize seus compromissos e visitas a imóveis." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Agenda />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/imoveis"
              element={
                <ProtectedAppLayout title="Imóveis" subtitle="Catálogo completo de propriedades." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Properties />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/propostas"
              element={
                <ProtectedAppLayout title="Propostas" subtitle="Acompanhamento e negociações ativas." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Proposals />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/contratos"
              element={
                <ProtectedAppLayout title="Contratos" subtitle="Gestão de contratos e documentação jurídica." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Contracts />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/juridico"
              element={
                <ProtectedAppLayout title="Jurídico & Contratos" subtitle="Processos jurídicos, validação de documentos e assinaturas." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Juridico />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedAppLayout title="Gestão de Clientes" subtitle="Visualize e gerencie os clientes da imobiliária." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <GestaoClientes />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/comissoes"
              element={
                <ProtectedAppLayout title="Comissões" subtitle="Comissões de corretores, regras e câmbio." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <ComissoesComercial />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/marketing"
              element={
                <ProtectedAppLayout title="Marketing" subtitle="Postagens, mídias e engajamento." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Marketing />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/treinamentos"
              element={
                <ProtectedAppLayout title="Treinamentos" subtitle="Curso de Neurovendas & capacitação da equipe." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Treinamentos />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/treinamentos/aula"
              element={
                <ProtectedAppLayout title="Aula de Neurovendas" subtitle="Apresentação da aula — Christiane Racanelli." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <TreinamentoAula />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/gestao"
              element={
                <ProtectedAppLayout title="Painel de Gestão" subtitle="Gestão de tarefas e solicitações da Christiane Racanelli (Business Advisor)." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Gestao />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ProtectedAppLayout title="Financeiro" subtitle="Dashboard financeiro — saldo, receitas, despesas e lucro." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialDashboard />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro/lancamentos"
              element={
                <ProtectedAppLayout title="Lançamentos" subtitle="Receitas e despesas do fluxo de caixa." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialLancamentos />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro/bancos"
              element={
                <ProtectedAppLayout title="Bancos & Contas" subtitle="Contas bancárias e saldos." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialBancos />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro/cartoes"
              element={
                <ProtectedAppLayout title="Cartões" subtitle="Cartões de crédito, limites e vencimentos." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialCartoes />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro/transferencias"
              element={
                <ProtectedAppLayout title="Transferências" subtitle="Movimentações entre contas bancárias." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialTransferencias />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/financeiro/categorias"
              element={
                <ProtectedAppLayout title="Categorias" subtitle="Organize e classifique os lançamentos." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <FinancialCategorias />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/vendas"
              element={
                <ProtectedAppLayout title="Contratos e Vendas" subtitle="Acompanhe os contratos assinados e imóveis vendidos" onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Vendas />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/tecnologia"
              element={
                <ProtectedAppLayout title="Squad de Tecnologia & Chamados" subtitle="Kanban de acompanhamento e triagem inteligente com Agente de IA." dark onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Tecnologia />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/notificacoes"
              element={
                <ProtectedAppLayout title="Notificações" subtitle="Acompanhe seus alertas e autorizações." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Notificacoes />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedAppLayout title="Configurações" subtitle="Gerencie as preferências e segurança do sistema." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Configuracoes />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/corretores"
              element={
                <ProtectedAppLayout title="Corretores & Equipe" subtitle="Gestão de usuários, metas e performance." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <Corretores />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedAppLayout title="Performance & Funil" subtitle="Funil de conversão, SLA de atendimento e ranking de corretores em tempo real." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <PerformanceFunil />
                </ProtectedAppLayout>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedAppLayout title="Editor de Imagens" subtitle="Crie, edite e gerencie imagens para seus materiais." onOpenWhatsApp={() => setWhatsappModalOpen(true)}>
                  <ImageEditor />
                </ProtectedAppLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </React.Suspense>
          </RouteErrorBoundary>
        </Router>
        </FinancialFiltersProvider>

        {/* WhatsApp Connection Modal - global */}
        <WhatsAppConnectionModal 
          isOpen={whatsappModalOpen} 
          onClose={() => setWhatsappModalOpen(false)} 
        />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}