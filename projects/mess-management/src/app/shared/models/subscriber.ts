export interface Subscriber {
  id: string | number;
  name: string;
  email: string;
  roll_number: string;
  mealPlan: string;
  status: string;
  joinedDate: string;
  // Additional fields for edit form
  startDate?: string; // DD/MM/YY format for form
  endDate?: string;   // DD/MM/YY format for form
  pauseEndDate?: string; // DD/MM/YY format for form
  pauseStartDate?: string; // DD/MM/YY format for form
  pauseReason?: string;
  mealNames?: string[]; // Original meal names from backend
  expiryWarning?: string;
  dayPreference?: string;
  superUser?: boolean;
}