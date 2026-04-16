import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Trash2, 
  User, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Space, Schedule, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TIME_SLOTS = [
  { label: '1º Horário', start: '07:00', end: '07:50', period: 'Manhã' },
  { label: '2º Horário', start: '07:50', end: '08:40', period: 'Manhã' },
  { label: 'Intervalo', start: '08:40', end: '09:00', period: 'Intervalo', isBreak: true },
  { label: '3º Horário', start: '09:00', end: '09:50', period: 'Manhã' },
  { label: '4º Horário', start: '09:50', end: '10:40', period: 'Manhã' },
  { label: '5º Horário', start: '10:40', end: '11:30', period: 'Manhã' },
  { label: '6º Horário', start: '11:30', end: '12:00', period: 'Manhã' },
  { label: 'Almoço', start: '12:00', end: '13:00', period: 'Intervalo', isBreak: true },
  { label: '1º Horário Tarde', start: '13:00', end: '13:50', period: 'Tarde' },
  { label: '2º Horário Tarde', start: '13:50', end: '14:40', period: 'Tarde' },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);

  // Refs
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterProfessor, setFilterProfessor] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<typeof TIME_SLOTS[0] | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [spacesData, schedulesData, profilesData] = await Promise.all([
        api.getSpaces(),
        api.getSchedulesByDate(date),
        api.getProfiles()
      ]);
      setSpaces(spacesData);
      setSchedules(schedulesData);
      setProfiles(profilesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (spaceId: string, slot: typeof TIME_SLOTS[0]) => {
    if (slot.isBreak) return;
    setSelectedSpaceId(spaceId);
    setSelectedSlot(slot);
    setProfessorName(profile?.name || '');
    setIsFormOpen(true);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedSpaceId || !professorName.trim()) return;

    setSubmitting(true);
    setFormError(null);

    // Encontrar o ID do professor selecionado (se admin) ou usar o ID do usuário logado
    let targetUserId = user?.id;
    if (profile?.role === 'admin') {
      const selectedProfile = profiles.find(p => p.name === professorName);
      if (selectedProfile) {
        targetUserId = selectedProfile.id;
      }
    }

    try {
      await api.addSchedule({
        space_id: selectedSpaceId,
        professor_name: professorName,
        user_id: targetUserId || '',
        date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      });
      await loadData();
      setIsFormOpen(false);
      setProfessorName('');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao agendar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(format(d, 'yyyy-MM-dd'));
  };

  const filteredSchedules = schedules.filter(s => 
    s.professor_name.toLowerCase().includes(filterProfessor.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Date Navigation and Filters */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <button 
            onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
            className="px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary-600 hover:bg-primary-50 rounded-lg transition border border-primary-100"
          >
            Hoje
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Dia anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div 
              className="relative group cursor-pointer"
              onClick={() => dateInputRef.current?.showPicker?.()}
            >
              <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-semibold group-hover:bg-primary-100 transition border border-primary-100">
                <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                <span className="capitalize text-sm md:text-base whitespace-nowrap">
                  {format(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <input 
                ref={dateInputRef}
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
              />
            </div>
            <button 
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Próximo dia"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por professor..."
              value={filterProfessor}
              onChange={(e) => setFilterProfessor(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 font-medium text-sm md:text-base">Carregando agenda...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-center gap-3 text-sm md:text-base">
          <XCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : (
        <div className="pb-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 items-start">
            {spaces.map(space => {
              const spaceSchedules = filteredSchedules.filter(s => s.space_id === space.id);
              
              const isExpanded = expandedSpaceId === space.id;
              
              return (
                <div key={space.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => setExpandedSpaceId(isExpanded ? null : space.id)}
                    className={`w-full text-left px-4 md:px-5 py-3 md:py-4 flex justify-between items-center transition-colors ${
                      isExpanded ? 'bg-primary-50/50 border-b border-gray-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${isExpanded ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-500 border'}`}>
                        <Clock className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <h3 className="font-bold text-base md:text-lg text-gray-800 truncate max-w-[150px] sm:max-w-none">{space.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="hidden sm:inline-block text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-full border">
                        {isExpanded ? 'Recolher' : 'Ver horários'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="divide-y divide-gray-100 animate-in slide-in-from-top-2 duration-200">
                      {TIME_SLOTS.map((slot, idx) => {
                        const booking = spaceSchedules.find(s => 
                          s.start_time.substring(0, 5) === slot.start
                        );
                        
                        if (slot.isBreak) {
                          return (
                            <div key={idx} className="px-4 md:px-5 py-2 bg-gray-50/50 flex items-center gap-3 md:gap-4">
                              <span className="text-[10px] md:text-xs font-bold text-gray-400 w-20 md:w-24 text-center italic shrink-0">
                                {slot.start} - {slot.end}
                              </span>
                              <div className="h-px flex-1 bg-gray-200"></div>
                              <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold whitespace-nowrap">
                                {slot.label}
                              </span>
                              <div className="h-px flex-1 bg-gray-200"></div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={idx} 
                            className={`px-4 md:px-5 py-2.5 md:py-3 flex items-center gap-3 md:gap-4 transition-colors ${
                              booking ? 'bg-primary-50/30' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-20 md:w-24 flex flex-col items-center shrink-0">
                              <span className="text-[10px] md:text-xs font-bold text-gray-500">{slot.start} - {slot.end}</span>
                              <span className="text-[8px] md:text-[10px] text-gray-400 uppercase">{slot.label}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              {booking ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{booking.professor_name}</p>
                                      <p className="text-[9px] md:text-[10px] text-primary-600 font-medium uppercase tracking-tight">Ocupado</p>
                                    </div>
                                  </div>
                                  {(booking.user_id === user?.id || profile?.role === 'admin') && (
                                    <button 
                                      onClick={() => handleDelete(booking.id)}
                                      className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleBookingClick(space.id, slot)}
                                  className="group flex items-center gap-2 text-gray-400 hover:text-primary-600 transition w-full text-left"
                                >
                                  <PlusCircle className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <span className="text-xs md:text-sm italic truncate">Disponível - Clique</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary-600 p-4 md:p-6 text-white">
              <h2 className="text-lg md:text-xl font-bold">Novo Agendamento</h2>
              <p className="text-primary-100 text-xs md:text-sm mt-1 truncate">
                {spaces.find(s => s.id === selectedSpaceId)?.name}
              </p>
            </div>
            
            <form onSubmit={handleAddSchedule} className="p-4 md:p-6 space-y-4 md:y-5">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="block text-[9px] md:text-[10px] text-gray-400 uppercase font-bold mb-1">Data</span>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-700 font-medium">
                    <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-500 shrink-0" />
                    {format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="block text-[9px] md:text-[10px] text-gray-400 uppercase font-bold mb-1">Horário</span>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-700 font-medium">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-500 shrink-0" />
                    {selectedSlot?.start} - {selectedSlot?.end}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">Nome do Professor</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  {profile?.role === 'admin' ? (
                    <select
                      required
                      value={professorName}
                      onChange={(e) => setProfessorName(e.target.value)}
                      className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition appearance-none bg-white"
                    >
                      <option value="">Selecione um professor</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      readOnly
                      required
                      type="text"
                      value={professorName}
                      placeholder="Quem está reservando?"
                      className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-600 cursor-not-allowed"
                    />
                  )}
                  {profile?.role === 'admin' && (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-[11px] md:text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 md:py-2.5 text-sm text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 md:py-2.5 bg-primary-600 text-sm text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-200 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="h-4 w-4 md:h-5 md:w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
