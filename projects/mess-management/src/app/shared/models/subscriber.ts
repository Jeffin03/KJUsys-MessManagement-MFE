export interface Subscriber {
  id: string | number;
  name: string;
  email: string;
  hmsId: string;
  mealPlan: string;
  status: 'Active' | 'Paused' | 'Lapsed';
  joinedDate: string;
}