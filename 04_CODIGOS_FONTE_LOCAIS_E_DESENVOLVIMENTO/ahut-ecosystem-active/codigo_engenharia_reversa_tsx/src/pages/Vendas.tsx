import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales, useDeleteSale } from '../hooks/useSales';
import { 
  DollarSign, Home, Coins, Search, Filter, Loader2, 
  FileX, User, Calendar, Trash2
} from 'lucide-react';

export default function Vendas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState<{ id: string, propertyId: string, buyerName: string } | null>(null);
  
  const { data: sales = [], isLoading } = useSales();
  const deleteSale = useDeleteSale();

  const handleDelete = async () => {
    if (deleteDialog) {
      try {
        await deleteSale.mutateAsync({ id: deleteDialog.id, property_id: deleteDialog.propertyId });
        setDeleteDialog(null);
      } catch (error) {
        console.error("Erro ao cancelar venda", error);
      }
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  
  const formatCurrency = (val: number) => "Gs " + val.toLocaleString("es-PY", { maximumFractionDigits: 0 });
  const formatDate = (val: string) => val ? new Date(val).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  const uniqueAgents = Array.from(new Map(sales.filter(s => s.agent).map(s => [s.agent!.id, s.agent!])).values());

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.property?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.property?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = agentFilter === 'all' || sale.agent_id === agentFilter;
    return matchesSearch && matchesAgent;
  });

  const totalVolume = filteredSales.reduce((acc, sale) => acc + Number(sale.sale_value), 0);
  const totalSales = filteredSales.length;
  const estimatedCommission = filteredSales.reduce((acc, sale) => acc + Number(sale.sale_value) * 0.05, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => navigate('/financeiro/comissoes')}
          className="flex items-center gap-2 px-4 py-2 border border-amber-500/30 text-slate-700 font-medium rounded-lg hover:bg-amber-50 transition-colors"
        >
          <Coins className="h-4 w-4 text-amber-500" />
          <span>Ver Comissões</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-neon-card p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-sm font-medium text-slate-500">Volume de Vendas</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalVolume)}</p>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <DollarSign className="h-3 w-3" />
              <span>Resultado consolidado</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 z-10 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-neon-card p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-sm font-medium text-slate-500">Imóveis Vendidos</p>
            <p className="text-3xl font-bold text-slate-900">{totalSales}</p>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <Home className="h-3 w-3" />
              <span>Contratos fechados</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 z-10 shrink-0">
            <Home className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-neon-card p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-sm font-medium text-slate-500">Comissão Estimada (5%)</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(estimatedCommission)}</p>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Coins className="h-3 w-3" />
              <span>Comissão global gerada</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 z-10 shrink-0">
            <Coins className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between glass-neon-card p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por comprador, código ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Corretores</option>
            {uniqueAgents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-neon-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileX className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">Nenhuma venda encontrada</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">
              Os registros de vendas aparecem aqui quando os contratos jurídicos correspondentes são assinados e concluídos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-medium select-none">
                  <th className="p-4 pl-6">Imóvel de Referência</th>
                  <th className="p-4">Cliente Comprador</th>
                  <th className="p-4">Corretor Responsável</th>
                  <th className="p-4">Valor da Venda</th>
                  <th className="p-4">Data do Contrato</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 font-bold text-xs select-none">
                          {sale.property?.code.slice(0, 3) || "REF"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {sale.property?.title || "Imóvel sem título"}
                          </p>
                          <span className="font-mono text-xs text-slate-500">
                            {sale.property?.code || "REF-000"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-900">{sale.buyer_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {sale.agent ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">
                            {getInitials(sale.agent.full_name)}
                          </div>
                          <span className="font-medium text-slate-900">{sale.agent.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Sem corretor</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(Number(sale.sale_value))}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(sale.contract_signed_at || '')}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all rounded-md flex items-center justify-center ml-auto"
                        title="Estornar/Excluir Venda"
                        disabled={deleteSale.isPending}
                        onClick={() => setDeleteDialog({ id: sale.id, propertyId: sale.property_id || '', buyerName: sale.buyer_name })}
                      >
                        {deleteSale.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Estornar/Excluir Venda</h3>
            <p className="text-slate-500 mt-2">Deseja realmente excluir o registro de venda de {deleteDialog.buyerName}? O imóvel correspondente voltará a ficar Disponível.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteDialog(null)} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancelar</button>
              <button onClick={handleDelete} disabled={deleteSale.isPending} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium">
                {deleteSale.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
