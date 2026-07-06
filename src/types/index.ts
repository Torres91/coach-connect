export type UserRole = 'coach' | 'school';

export type JobStatus = 'open' | 'filled' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
] as const;

export const SPORTS = [
  'Soccer', 'Cricket', 'Rugby', 'Netball', 'Hockey', 'Athletics',
  'Swimming', 'Tennis', 'Basketball', 'Volleyball', 'Gymnastics', 'Multi-sport',
] as const;

export const AGE_GROUPS = [
  'U6', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U16', 'U18', 'Open',
] as const;

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
}

export interface School {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  province: string | null;
  logo_url: string | null;
  contact_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface CoachProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  province: string | null;
  sports: string[];
  experience_years: number;
  hourly_rate: number | null;
  avatar_url: string | null;
  available: boolean;
  available_days: string[];  // e.g. ['Monday','Wednesday','Friday']
  created_at: string;
}

export interface Job {
  id: string;
  school_id: string;
  title: string;
  sport: string;
  date: string | null;
  time: string | null;
  duration_hours: number | null;
  age_group: string | null;
  pay: number | null;
  notes: string | null;
  status: JobStatus;
  created_at: string;
  // Booking model
  booking_type:     'single' | 'recurring' | 'term' | null;
  role:             string | null;
  num_required:     number | null;
  start_date:       string | null;
  end_date:         string | null;
  term_number:      number | null;
  term_year:        number | null;
  days_of_week:     string[] | null;
  time_start:       string | null;
  time_end:         string | null;
  // Requirements
  req_first_aid:          boolean | null;
  req_police_clearance:   boolean | null;
  req_transport:          boolean | null;
  req_coaching_badge:     boolean | null;
  req_experience_years:   number | null;
  // Budget
  budget_amount:    number | null;
  budget_period:    'session' | 'hour' | 'week' | 'month' | null;
  school?: School;
}

export interface Session {
  id: string;
  job_id: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  coach_id: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  coach_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  job?: Job;
  coach?: CoachProfile;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  job_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
}
