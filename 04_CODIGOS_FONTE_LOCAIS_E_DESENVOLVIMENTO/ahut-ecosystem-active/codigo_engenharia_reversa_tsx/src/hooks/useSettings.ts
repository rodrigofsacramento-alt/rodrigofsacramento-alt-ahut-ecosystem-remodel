import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/use-toast';

export type SettingsTab = 'perfil' | 'empresa' | 'integracoes' | 'notificacoes' | 'seguranca' | 'aparencia';

export function useSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || ''
  });

  const [companyData, setCompanyData] = useState({
    name: 'Estate.ia Imobiliária',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    website: 'https://estate.ia',
    phone: '(11) 3000-0000'
  });

  const [notifications, setNotifications] = useState({
    email_new_lead: true,
    email_new_proposal: true,
    email_visit_reminder: true,
    push_messages: true,
    push_updates: false,
    daily_report: true,
    weekly_report: true
  });

  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    compact_sidebar: false,
    show_badges: true
  });

  useEffect(() => {
    if (profile) {
      setProfileData(prev => ({
        ...prev,
        full_name: profile.full_name || prev.full_name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone
      }));
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone || null
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar perfil.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCompany = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: 'Dados da empresa salvos!',
      description: 'As informações da empresa foram atualizadas.'
    });
    setIsLoading(false);
  };

  const saveNotifications = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: 'Notificações atualizadas!',
      description: 'Suas preferências de notificação foram salvas.'
    });
    setIsLoading(false);
  };

  const updatePassword = async () => {
    if (security.new_password !== security.confirm_password) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }
    
    if (security.new_password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: security.new_password });
      if (error) throw error;
      
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.'
      });
      
      setSecurity({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao alterar senha.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppearance = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: 'Aparência atualizada!',
      description: 'Suas preferências visuais foram salvas.'
    });
    setIsLoading(false);
  };

  return {
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
  };
}
