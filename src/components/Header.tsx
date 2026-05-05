import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoCead from '../assets/img/CEAD.png';

export default function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img src={logoCead} alt="Logo CEAD" className="h-10 w-auto" />
            <span className="text-xl font-bold text-gray-900 truncate">Agenda de Recursos</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Agendamentos
              </Link>
              {profile?.role === 'admin' && (
                <>
                  <Link to="/spaces" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Recursos
                  </Link>
                  <Link to="/admin" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Professores
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-4 pl-4 border-l">
              <span className="text-sm font-medium text-gray-700">
                Olá, {profile?.name?.split(' ')[0] || 'Professor'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-600 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b animate-in slide-in-from-top duration-200">
          <nav className="px-4 pt-2 pb-4 space-y-1">
            <Link 
              to="/" 
              onClick={closeMenu}
              className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
            >
              Agendamentos
            </Link>
            {profile?.role === 'admin' && (
              <>
                <Link 
                  to="/spaces" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Recursos
                </Link>
                <Link 
                  to="/admin" 
                  onClick={closeMenu}
                  className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Professores
                </Link>
              </>
            )}
            <div className="pt-4 pb-2 border-t mt-4">
              <div className="flex items-center px-3 mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Olá, {profile?.name || 'Professor'}
                </span>
              </div>
              <button 
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className="w-full text-left flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sair do Sistema
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
