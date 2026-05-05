import { supabase } from './supabase';
import type { Space, Schedule, Profile, Equipment, EquipmentSchedule } from '../types';

const supabaseTableError = (error: any, table: string) => {
  if (!error) return null;
  const message = String(error?.message || '');
  if (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    (message.includes('Could not find the table') && message.includes('schema cache'))
  ) {
    return new Error(`A tabela "${table}" não existe no Supabase. Crie a tabela e configure as políticas (RLS) para permitir leitura e escrita.`);
  }
  if (error?.code === '42501' || message.includes('permission denied')) {
    return new Error(`Sem permissão para acessar a tabela "${table}". Verifique as políticas (RLS) no Supabase.`);
  }
  return error;
};

export const api = {
  async getSpaces(): Promise<Space[]> {
    const { data, error } = await supabase.from('spaces').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async getEquipments(): Promise<Equipment[]> {
    const { data, error } = await supabase.from('equipments').select('*').order('name');
    if (error) throw supabaseTableError(error, 'equipments');
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

  async addEquipment(equipment: Omit<Equipment, 'id' | 'created_at'>): Promise<Equipment> {
    const { data, error } = await supabase.from('equipments').insert(equipment).select().single();
    if (error) throw supabaseTableError(error, 'equipments');
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

  async getEquipmentSchedulesByDate(date: string): Promise<EquipmentSchedule[]> {
    const { data, error } = await supabase
      .from('equipment_schedules')
      .select('*, equipment:equipments(*)')
      .eq('date', date)
      .order('start_time');

    if (error) throw supabaseTableError(error, 'equipment_schedules');
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

  async getSchedulesByEquipmentAndDate(equipmentId: string, date: string): Promise<EquipmentSchedule[]> {
    const { data, error } = await supabase
      .from('equipment_schedules')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('date', date)
      .order('start_time');

    if (error) throw supabaseTableError(error, 'equipment_schedules');
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

  async addEquipmentSchedule(
    schedule: Omit<EquipmentSchedule, 'id' | 'created_at' | 'equipment'>
  ): Promise<EquipmentSchedule> {
    const existing = await this.getSchedulesByEquipmentAndDate(schedule.equipment_id, schedule.date);

    const newStart = schedule.start_time.substring(0, 5);
    const newEnd = schedule.end_time.substring(0, 5);

    const hasConflict = existing.some(s => {
      const existingStart = s.start_time.substring(0, 5);
      const existingEnd = s.end_time.substring(0, 5);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      throw new Error('Conflito de horário! Já existe um agendamento para este equipamento neste intervalo.');
    }

    const { data, error } = await supabase
      .from('equipment_schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw supabaseTableError(error, 'equipment_schedules');
    return data;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteEquipmentSchedule(id: string): Promise<void> {
    const { error } = await supabase.from('equipment_schedules').delete().eq('id', id);
    if (error) throw supabaseTableError(error, 'equipment_schedules');
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
