export interface PerformanceEmployee {
  id: string | number;
  status?: string;
  reviewId?: string | number;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  jobTitle?: string;
  employeeId?: string;
  department?: string;
  score?: number | string | null;
  lastEvaluationDate?: string | null;
  duties?: string;
}

export interface PerformanceItem {
  id?: string | number;
  criteriaId?: string | number | null;
  category?: string | null;
  criteriaTitle?: string | null;
  title?: string | null;
  criteriaDescription?: string | null;
  description?: string | null;
  weight?: number | string | null;
  score?: number | null;
  selfScore?: number | null;
  actualAccomplishments?: string | null;
  comment?: string | null;
  qScore?: number | string | null;
  eScore?: number | string | null;
  tScore?: number | string | null;
  ratingDefinition5?: string;
  ratingDefinition4?: string;
  ratingDefinition3?: string;
  ratingDefinition2?: string;
  ratingDefinition1?: string;
  evidenceRequirements?: string;
  evidenceFilePath?: string;
  evidenceDescription?: string | null;
  section?: string | null;
  maxScore?: number | string | null;
}

export interface PerformanceReview {
  id: string | number;
  employeeId: string | number;
  reviewerId?: string | number;
  reviewCycleId?: string | number;
  status: string;
  totalScore?: string | number;
  selfRatingScore?: string | number;
  reviewerRatingScore?: string | number;
  reviewPeriodStart?: string;
  reviewPeriodEnd?: string;
  overallFeedback?: string;
  disagreed?: boolean;
  disagreeRemarks?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
  attendanceDetails?: {
    totalLates: number;
    totalUndertime: number;
    totalAbsences: number;
    totalLateMinutes: number;
    ratingDescription: string;
  } | null;
  violationCount?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: PerformanceItem[];
}
