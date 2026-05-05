export type Profile = {
  id: string;
  name: string;
  email?: string;
  role: string;
};

export type Space = {
  id: string;
  name: string;
  created_at?: string;
};

export type Equipment = {
  id: string;
  name: string;
  created_at?: string;
};

export type Schedule = {
  id: string;
  space_id: string;
  professor_name: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  created_at?: string;
  space?: Space;
};

export type EquipmentSchedule = {
  id: string;
  equipment_id: string;
  professor_name: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  created_at?: string;
  equipment?: Equipment;
};
