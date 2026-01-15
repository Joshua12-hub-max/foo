export interface PlantillaSummary {
  total: number;
  filled: number;
  vacant: number;
  vacancy_rate: number;
}



export const INITIAL_SUMMARY: PlantillaSummary = { 
  total: 0, 
  filled: 0, 
  vacant: 0, 
  vacancy_rate: 0 
};
