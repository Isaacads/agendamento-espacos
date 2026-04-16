import { supabase } from './supabase';
import type { Space, Schedule, Profile } from '../types';

export const api = {
  async getSpaces(): Promise<Space[]> {
    const { data, error } = await supabase.from('spaces').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addSpace(space: Omit<Space, 'id' | 'created_at'>): Promise<Space> {
    const { data, error } = await supabase.from('spaces').insert(space).select().single();
    if (error) throw error;
    return data;
  },

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, space:spaces(*)')
      .eq('date', date)
      .order('start_time');
    
    if (error) throw error;
    return data || [];
  },

  async getSchedulesBySpaceAndDate(spaceId: string, date: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('space_id', spaceId)
      .eq('date', date)
      .order('start_time');
    
    if (error) throw error;
    return data || [];
  },

  async addSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'space'>): Promise<Schedule> {
    // Verificar conflitos de horário antes de inserir (simulação simples)
    const existing = await this.getSchedulesBySpaceAndDate(schedule.space_id, schedule.date);
    
    // Normalizar horários para comparação (HH:mm)
    const newStart = schedule.start_time.substring(0, 5);
    const newEnd = schedule.end_time.substring(0, 5);

    const hasConflict = existing.some(s => {
      const existingStart = s.start_time.substring(0, 5);
      const existingEnd = s.end_time.substring(0, 5);
      
      // Verifica se há sobreposição de horários
      // O novo horário inicia antes do existente terminar E termina depois do existente iniciar
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      throw new Error('Conflito de horário! Já existe um agendamento para este espaço neste intervalo.');
    }

    const { data, error } = await supabase.from('schedules').insert(schedule).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async updateUserAuth(userId: string, newEmail: string, newPassword?: string): Promise<void> {
    const { error } = await supabase.rpc('admin_update_user_auth', {
      user_id: userId,
      new_email: newEmail,
      new_password: newPassword || null
    });
    if (error) throw error;
  }
};
