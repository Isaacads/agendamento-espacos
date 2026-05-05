import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Equipment, Space } from '../types';
import { PlusCircle, Building, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Spaces() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'spaces' | 'equipments'>('spaces');
  const [items, setItems] = useState<Array<Space | Equipment>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const data = activeTab === 'spaces' ? await api.getSpaces() : await api.getEquipments();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setItems([]);
      setError(err?.message || (activeTab === 'spaces' ? 'Erro ao carregar espaços' : 'Erro ao carregar equipamentos'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      if (activeTab === 'spaces') {
        await api.addSpace({ name });
      } else {
        await api.addEquipment({ name });
      }
      setName('');
      await loadItems();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (activeTab === 'spaces' ? 'Erro ao adicionar espaço' : 'Erro ao adicionar equipamento'));
    } finally {
      setSubmitting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-500 mt-2">Apenas administradores podem gerenciar recursos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('spaces')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition border ${
              activeTab === 'spaces'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Espaços
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('equipments')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition border ${
              activeTab === 'equipments'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Equipamentos
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
            <PlusCircle className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {activeTab === 'spaces' ? 'Cadastrar Novo Espaço' : 'Cadastrar Novo Equipamento'}
          </h2>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 md:gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeTab === 'spaces' ? 'Nome do Ambiente' : 'Nome do Equipamento'}
            </label>
            <input
              required
              type="text"
              placeholder={activeTab === 'spaces' ? 'Ex: Laboratório de Informática 1' : 'Ex: Projetor Multimídia'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm md:text-base"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm md:text-base"
          >
            {submitting ? (
              <div className="h-4 w-4 md:h-5 md:w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
            ) : (
              'Adicionar'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">
            {activeTab === 'spaces' ? 'Espaços Cadastrados' : 'Equipamentos Cadastrados'}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 md:p-12 text-center text-gray-500">Carregando...</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map(item => (
              <li key={item.id} className="p-4 md:px-6 md:py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4 truncate mr-4">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                    <Building className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <span className="font-medium text-gray-700 text-sm md:text-base truncate">{item.name}</span>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="p-8 md:p-12 text-center text-gray-500 italic text-sm md:text-base">
                {activeTab === 'spaces' ? 'Nenhum espaço cadastrado.' : 'Nenhum equipamento cadastrado.'}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
