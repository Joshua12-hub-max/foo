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
  duties?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface PerformanceItem {
  id?: string | number;
  criteria_id?: string | number;
  category?: string | null;
  criteria_title?: string | null;
  title?: string | null;
  criteria_description?: string | null;
  description?: string | null;
  weight?: number | string | null;
  score?: number;
  self_score?: number;
  actual_accomplishments?: string;
  comment?: string;
  q_score?: number | string;
  e_score?: number | string;
  t_score?: number | string;
  rating_definition_5?: string;
  rating_definition_4?: string;
  rating_definition_3?: string;
  rating_definition_2?: string;
  rating_definition_1?: string;
  evidence_requirements?: string;
  evidence_file_path?: string;
  evidence_description?: string;
  // CamelCase variants for consistency with API
  ratingDefinition5?: string;
  ratingDefinition4?: string;
  ratingDefinition3?: string;
  ratingDefinition2?: string;
  ratingDefinition1?: string;
  evidenceRequirements?: string;
  evidenceFilePath?: string;
  evidenceDescription?: string | null;
  [key: string]: string | number | boolean | null | undefined | object | any[];
}
