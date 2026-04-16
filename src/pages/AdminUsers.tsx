import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Profile } from '../types';
import { PlusCircle, User, Shield, AlertCircle, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Cliente temporário para criar usuários sem deslogar o Admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setSubmitting(true);
    setError(null);
    try {
      // Criar um cliente Supabase temporário que NÃO persiste a sessão
      // Isso impede que o Admin seja deslogado ao criar um novo usuário
      const tempSupabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      // 1. Criar usuário no Auth
      const { data, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Criar perfil usando o cliente principal (que já tem a sessão do Admin)
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            name, 
            email, // Salva o e-mail no perfil público para fácil acesso e edição
            role: 'Professor' 
          }]);
        
        if (profileError) throw profileError;
      }

      // Limpar formulário
      setEmail('');
      setPassword('');
      setName('');
      await loadUsers();
      alert('Professor cadastrado com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao adicionar professor');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: Profile) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email || ''); 
    setEditPassword('');
    setConfirmPassword('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit || !editName.trim() || !editEmail.trim()) return;

    if (editPassword && editPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    
    setSubmitting(true);
    try {
      // 1. Atualizar o LOGIN (Autenticação) via RPC (Email e Senha opcional)
      await api.updateUserAuth(userToEdit.id, editEmail, editPassword);

      // 2. Atualizar o nome e email no perfil público
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: editName,
          email: editEmail
        })
        .eq('id', userToEdit.id);
      
      if (profileError) throw profileError;

      setIsEditModalOpen(false);
      setUserToEdit(null);
      await loadUsers();
      alert('Dados do professor atualizados com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + (err.message || 'Ocorreu um erro inesperado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (user: Profile) => {
    if (user.id === profile?.id) {
      alert('Você não pode excluir seu próprio perfil de administrador.');
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);
      
      if (error) throw error;
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir professor');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirecionar ou bloquear se não for admin
  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-500 mt-2">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
            <PlusCircle className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Cadastrar Novo Professor</h2>
        </div>

        <form onSubmit={handleAddUser} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                required
                type="text"
                placeholder="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm md:text-base"
              />
            </div>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                required
                type="email"
                placeholder="E-mail de Login"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm md:text-base"
              />
            </div>
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <input
              required
              type="password"
              placeholder="Senha de Acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm md:text-base"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs md:text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition shadow-lg shadow-primary-100 flex items-center justify-center gap-2 text-sm md:text-base"
          >
            {submitting ? (
              <div className="h-4 w-4 md:h-5 md:w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
                Cadastrar Professor
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Professores Cadastrados</h3>
          <span className="text-[10px] md:text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full border">
            {users.length} usuários
          </span>
        </div>
        
        {loading ? (
          <div className="p-8 md:p-12 text-center text-gray-500">Carregando usuários...</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map(u => (
              <li key={u.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-full shrink-0">
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">{u.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.role}
                      </span>
                      {u.email && (
                        <span className="text-[10px] md:text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">
                          {u.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 md:p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition"
                    title="Editar professor"
                  >
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => confirmDelete(u)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      title="Excluir professor"
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de Edição de Professor */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Editar Professor</h2>
                <p className="text-primary-100 text-sm mt-1">Atualize os dados de {userToEdit?.name}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    required
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="E-mail para login"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nova Senha</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Deixe em branco para não alterar"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar Senha</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition text-sm"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 italic">
                A alteração de e-mail e senha afeta o login original do professor.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-200 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 mb-6">
                Você tem certeza que deseja excluir o perfil de <span className="font-bold text-gray-900">"{userToDelete?.name}"</span>? 
                Esta ação não poderá ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                  ) : (
                    'Excluir Agora'
                  )}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 text-[10px] text-gray-400 text-center border-t">
              Esta ação remove apenas o perfil do sistema, o login de autenticação permanece no Supabase.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
