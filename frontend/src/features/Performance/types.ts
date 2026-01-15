export interface PerformanceEmployee {
  id: string | number;
  status?: string;
  review_id?: string | number;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  job_title?: string;
  employee_id?: string;
  department?: string;
  score?: number | string | null;
  last_evaluation_date?: string | null;
  [key: string]: any;
}

export interface PerformanceItem {
  id?: string | number;
  criteria_id?: string | number;
  category?: string;
  criteria_title?: string;
  title?: string;
  criteria_description?: string;
  description?: string;
  weight?: number | string;
  score?: number;
  self_score?: number;
  actual_accomplishments?: string;
  comment?: string;
  q_score?: number | string;
  e_score?: number | string;
  t_score?: number | string;
  [key: string]: any;
}
