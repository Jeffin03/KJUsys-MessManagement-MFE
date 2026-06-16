export interface Subscriber {
  id: string | number;
  name: string;
  email: string;
  roll_number: string;
  mealPlan: string;
  status: 'Active' | 'Paused' | 'Lapsed';
  joinedDate: string;
}
