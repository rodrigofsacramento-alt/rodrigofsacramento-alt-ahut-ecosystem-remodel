import React from 'react';
import { 
  User, 
  Building2, 
  Link as LinkIcon, 
  Bell, 
  Shield, 
  Palette,
  Loader2,
  Mail,
  Phone,
  Hash,
  MapPin,
  Globe,
  Lock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useSettings, SettingsTab } from '../hooks/useSettings';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'integracoes', label: 'Integrações', icon: LinkIcon },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'aparencia', label: 'Aparência', icon: Palette }
];

export function Configuracoes() {
  const { profile } = useAuth();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    profileData,
    setProfileData,
    companyData,
    setCompanyData,
    notifications,
    setNotifications,
    security,
    setSecurity,
    appearance,
    setAppearance,
    saveProfile,
    saveCompany,
    saveNotifications,
    updatePassword,
    saveAppearance
  } = useSettings();

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-800 dark:text-slate-200">{label}</span>
      <button onClick={() => onChange(!checked)} className="text-blue-600 focus:outline-none">
        {checked ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          
          {/* TAB: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Meu Perfil</h2>
              </div>
              
              <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{profile?.full_name || 'Usuário'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Gestor' : 'Corretor'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={e => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">O email não pode ser alterado.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={saveProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* TAB: EMPRESA */}
          {activeTab === 'empresa' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dados da Empresa</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Nome da Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={e => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">CNPJ</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={companyData.cnpj}
                        onChange={e => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={e => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={companyData.address}
                      onChange={e => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={companyData.website}
                      onChange={e => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={saveCompany}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICACOES */}
          {activeTab === 'notificacoes' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notificações</h2>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Email</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-b border-slate-100 dark:border-slate-700">
                  <Toggle label="Novo lead recebido" checked={notifications.email_new_lead} onChange={v => setNotifications(prev => ({ ...prev, email_new_lead: v }))} />
                  <Toggle label="Nova proposta criada" checked={notifications.email_new_proposal} onChange={v => setNotifications(prev => ({ ...prev, email_new_proposal: v }))} />
                  <Toggle label="Lembrete de visita" checked={notifications.email_visit_reminder} onChange={v => setNotifications(prev => ({ ...prev, email_visit_reminder: v }))} />
                </div>
              </div>

              <div className="space-y-1 mt-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Push / Sistema</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-b border-slate-100 dark:border-slate-700">
                  <Toggle label="Novas mensagens" checked={notifications.push_messages} onChange={v => setNotifications(prev => ({ ...prev, push_messages: v }))} />
                  <Toggle label="Atualizações do sistema" checked={notifications.push_updates} onChange={v => setNotifications(prev => ({ ...prev, push_updates: v }))} />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={saveNotifications}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}

          {/* TAB: SEGURANCA */}
          {activeTab === 'seguranca' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Segurança</h2>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Alterar Senha</h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Senha Atual</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={security.current_password}
                      onChange={e => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="Digite sua senha atual"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={security.new_password}
                        onChange={e => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={security.confirm_password}
                        onChange={e => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Repita a nova senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={updatePassword}
                  disabled={isLoading || !security.new_password}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Alterar Senha
                </button>
              </div>
            </div>
          )}

          {/* TAB: APARENCIA (Opcional, minimalista) */}
          {activeTab === 'aparencia' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aparência</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">Tema</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAppearance(prev => ({ ...prev, theme: 'light' }))}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-colors text-center",
                        appearance.theme === 'light' ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                      )}
                    >
                      <div className="h-12 w-12 mx-auto mb-2 rounded-lg bg-white border border-slate-200 shadow-sm" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Claro</p>
                    </button>
                    <button
                      onClick={() => setAppearance(prev => ({ ...prev, theme: 'dark' }))}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-colors text-center",
                        appearance.theme === 'dark' ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                      )}
                    >
                      <div className="h-12 w-12 mx-auto mb-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm" />
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Escuro</p>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-slate-100 dark:border-slate-700 pt-2">
                  <Toggle label="Sidebar compacta por padrão" checked={appearance.compact_sidebar} onChange={v => setAppearance(prev => ({ ...prev, compact_sidebar: v }))} />
                  <Toggle label="Mostrar badges de notificação" checked={appearance.show_badges} onChange={v => setAppearance(prev => ({ ...prev, show_badges: v }))} />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={saveAppearance}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}

          {/* TAB: INTEGRACOES */}
          {activeTab === 'integracoes' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center gap-3 mb-6">
                <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Integrações</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">Gerencie as conexões com serviços externos.</p>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between">
                 <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Google Workspace</h3>
                    <p className="text-sm text-slate-500">Conecte sua conta do Google para sincronizar calendário e drive.</p>
                 </div>
                 <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Conectar
                 </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
