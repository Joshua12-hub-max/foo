export interface PlantillaSummary {
  total: number;
  filled: number;
  vacant: number;
  vacancyRate: number;
}



export const INITIAL_SUMMARY: PlantillaSummary = { 
  total: 0, 
  filled: 0, 
  vacant: 0, 
  vacancyRate: 0 
};
