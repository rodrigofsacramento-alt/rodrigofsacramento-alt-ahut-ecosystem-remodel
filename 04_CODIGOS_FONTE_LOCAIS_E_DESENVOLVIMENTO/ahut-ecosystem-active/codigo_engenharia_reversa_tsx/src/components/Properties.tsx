import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  MoreVertical, 
  Heart, 
  Eye, 
  Edit2, 
  Trash2,
  Bed,
  Bath,
  Car,
  Maximize2,
  X,
  Upload,
  Link as LinkIcon,
  MapPin,
  Home,
  DollarSign,
  Users
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const properties = [
  { id: 1, code: 'AP8736', title: 'Mansão Alphaville Premium', location: 'Alameda das Palmeiras, 450 - Alphaville', price: 2450000, status: 'available', type: 'Residencial', beds: 4, baths: 5, area: 450, parking: 3, image: 'https://picsum.photos/seed/house1/800/600', desc: 'Mansão de alto padrão com piscina aquecida, área gourmet completa, home theater e jardim paisagístico.' },
  { id: 2, code: 'AP8737', title: 'Apartamento Jardins Luxo', location: 'Rua Oscar Freire, 1200 - Jardins', price: 1850000, status: 'reserved', type: 'Residencial', beds: 3, baths: 3, area: 180, parking: 2, image: 'https://picsum.photos/seed/house2/800/600', desc: 'Apartamento reformado com acabamento premium, varanda gourmet e vista para o parque.' },
  { id: 3, code: 'AP8738', title: 'Residência Morumbi', location: 'Rua das Magnólias, 89 - Morumbi', price: 3200000, status: 'sold', type: 'Residencial', beds: 5, baths: 6, area: 600, parking: 4, image: 'https://picsum.photos/seed/house3/800/600', desc: 'Casa em condomínio fechado com segurança 24h, 5 suítes e quadra de tênis.' },
  { id: 4, code: 'AP8739', title: 'Laje Corporativa Faria Lima', location: 'Av. Faria Lima, 3500 - Itaim Bibi', price: 12000, status: 'available', type: 'Comercial', beds: 0, baths: 4, area: 350, parking: 8, image: 'https://picsum.photos/seed/office1/800/600', desc: 'Laje corporativa com infraestrutura completa, piso elevado e ar condicionado central.', priceType: 'mês' },
  { id: 5, code: 'AP8740', title: 'Loft Industrial Pinheiros', location: 'Rua dos Pinheiros, 780', price: 890000, status: 'available', type: 'Residencial', beds: 1, baths: 1, area: 65, parking: 1, image: 'https://picsum.photos/seed/house4/800/600', desc: 'Loft com pé direito duplo, estilo industrial e varanda integrada.' },
  { id: 6, code: 'AP8741', title: 'Villa Beira-Mar Floripa', location: 'Rua da Praia, 12 - Jurerê Internacional', price: 5500000, status: 'available', type: 'Residencial', beds: 4, baths: 5, area: 400, parking: 4, image: 'https://picsum.photos/seed/house5/800/600', desc: 'Villa exclusiva à beira-mar com acesso direto à praia e piscina infinita.' },
];

export default function Properties() {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-200/50 rounded-xl">
            <button className="px-4 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm">Todos</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Residencial</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Comercial</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Terrenos</button>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Filtros Avançados</span>
          </div>
          
          <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
            <option>Ordenar: Mais Recentes</option>
            <option>Preço: Menor para Maior</option>
            <option>Preço: Maior para Menor</option>
          </select>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-400")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((prop) => (
          <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <div className="relative h-48 overflow-hidden">
              <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-md uppercase",
                  prop.status === 'available' ? "bg-orange-500 text-white" :
                  prop.status === 'reserved' ? "bg-[#1E293B] text-white" :
                  "bg-slate-500 text-white"
                )}>
                  {prop.status === 'available' ? 'Disponível' : prop.status === 'reserved' ? 'Reservado' : 'Vendido'}
                </span>
              </div>
              <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-bold text-lg drop-shadow-md">
                  {formatCurrency(prop.price)}
                  {prop.priceType && <span className="text-xs font-normal opacity-80">/{prop.priceType}</span>}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate">{prop.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-500 truncate">{prop.location}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                {prop.desc}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Bed className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{prop.beds}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Bath className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{prop.baths}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Car className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{prop.parking}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"><Eye className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cadastrar Imóvel */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cadastrar Imóvel</h3>
                  <p className="text-xs text-slate-500">Preencha os dados do novo imóvel</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Dados Básicos */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Home className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Dados Básicos</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Título do Imóvel *</label>
                    <input type="text" placeholder="Ex: Apartamento Jardins Luxo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Código</label>
                    <input type="text" placeholder="Ex: AP8736" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tipo</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>Residencial</option>
                      <option>Comercial</option>
                      <option>Terreno</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>Disponível</option>
                      <option>Reservado</option>
                      <option>Vendido</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Preço e Localização */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <DollarSign className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Preço e Localização</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Preço *</label>
                    <input type="number" placeholder="Ex: 1850000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tipo de Preço</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500">
                      <option>Venda</option>
                      <option>Aluguel</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Endereço Completo</label>
                    <input type="text" placeholder="Ex: Rua Oscar Freire, 1200 - Jardins, São Paulo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Bairro / Região</label>
                    <input type="text" placeholder="Ex: Jardins - São Paulo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                </div>
              </section>

              {/* Características */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Maximize2 className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Características</h4>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Quartos</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Banheiros</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Salas</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Vagas</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Área (m²)</label>
                    <input type="number" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                </div>
              </section>

              {/* Imagens */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Plus className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Imagens</h4>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-4 hover:border-orange-500 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Clique para enviar imagens</p>
                    <p className="text-xs text-slate-500">JPG, PNG, WebP ou GIF (máx. 10MB cada)</p>
                  </div>
                  <button className="text-xs font-bold text-orange-500 flex items-center gap-2 mx-auto">
                    <LinkIcon className="w-3 h-3" />
                    Adicionar por URL
                  </button>
                </div>
              </section>

              {/* Proprietário e Descrição */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-500">
                  <Users className="w-4 h-4" />
                  <h4 className="text-sm font-bold">Proprietário e Descrição</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nome do Proprietário</label>
                    <input type="text" placeholder="Ex: João Silva" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Telefone do Proprietário</label>
                    <input type="text" placeholder="Ex: 11999998888" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Descrição</label>
                  <textarea rows={4} placeholder="Descreva o imóvel..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 resize-none" />
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button className="px-6 py-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-lg shadow-orange-500/20">
                Confirmar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
