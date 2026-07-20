import { Injectable } from '@angular/core';
import { MealSlotWithCode } from './meal-slot.service';
import { Subscriber } from '../models/subscriber';

export interface SubscriberFormValue {
  firstName: string;
  lastName: string;
  email: string;
  roll_number: string;
  superUser: boolean;
  mealSlot: {
    startDate: string;
    endDate: string;
    status: string;
    selectedMeals: string[];
    dayPreference: string;
  };
  pauseEndDate: string;
  pauseStartDate: string;
  pauseReason: string;
}

export interface ValidationErrors {
  firstName: string;
  lastName: string;
  email: string;
  roll_number: string;
  pauseEndDate: string;
  pauseStartDate: string;
  pauseReason: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Injectable({
  providedIn: 'root'
})
export class SubscriberFormService {

  parseDate(dateStr: string): number {
    if (!dateStr) return 0;
    const [dd, mm, yy] = dateStr.split('/').map(Number);
    return new Date(2000 + yy, mm - 1, dd).getTime();
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  getMealPlanFromCodes(codes: string[], mealSlots: MealSlotWithCode[]): string {
    const selectedCodes = codes
      .filter(code => code)
      .map(code => mealSlots.find(s => s.code === code.toUpperCase()))
      .filter(Boolean)
      .map(s => s!.code);

    return selectedCodes.join('+');
  }

  getCodesFromMealPlan(mealPlan: string, mealSlots: MealSlotWithCode[]): string[] {
    if (!mealPlan) return [];
    const planCodes = mealPlan.toUpperCase().split('+');
    const codes: string[] = [];

    planCodes.forEach(code => {
      const slot = mealSlots.find(s => s.code.toUpperCase() === code.toUpperCase());
      if (slot) {
        codes.push(slot.code);
      }
    });

    return codes;
  }

  validateForm(form: SubscriberFormValue): ValidationErrors {
    const errors: ValidationErrors = {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: '',
      pauseEndDate: '',
      pauseStartDate: '',
      pauseReason: ''
    };

    const nameRegex = /^[A-Za-z ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (!nameRegex.test(form.firstName)) {
      errors.firstName = 'Only letters are allowed';
    }

    if (!form.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!nameRegex.test(form.lastName)) {
      errors.lastName = 'Only letters are allowed';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      errors.email = 'Invalid email address';
    }

    if (!form.roll_number.trim()) {
      errors.roll_number = 'Roll number is required';
    }

    // Date errors are handled separately via validateDates() in the component

    if (form.mealSlot.status === 'Paused') {
      if (!form.pauseStartDate || !form.pauseStartDate.trim()) {
        errors.pauseStartDate = 'Pause start date is required';
      }
      if (!form.pauseEndDate || !form.pauseEndDate.trim()) {
        errors.pauseEndDate = 'Pause end date is required';
      }
      if (!form.pauseReason || !form.pauseReason.trim()) {
        errors.pauseReason = 'Reason for pause is required';
      }
    }

    return errors;
  }

  validateDates(start: string, end: string): string | null {
    if (!start || !end) return 'Subscription period is required';

    const [sd, sm, sy] = start.split('/').map(Number);
    const [ed, em, ey] = end.split('/').map(Number);

    const startDate = new Date(2000 + sy, sm - 1, sd);
    const endDate = new Date(2000 + ey, em - 1, ed);

    if (startDate.getTime() === endDate.getTime()) {
      return 'Start and end date cannot be the same';
    } else if (endDate < startDate) {
      return 'End date cannot be earlier than start date';
    }
    return null;
  }

  initializeForm(mealSlots: MealSlotWithCode[]): SubscriberFormValue {
    return {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: '',
      superUser: false,
      mealSlot: {
        startDate: '',
        endDate: '',
        status: 'Active',
        selectedMeals: [],
        dayPreference: 'all'
      },
      pauseEndDate: '',
      pauseStartDate: '',
      pauseReason: ''
    };
  }

  populateForm(subscriber: Subscriber, mealSlots: MealSlotWithCode[]): SubscriberFormValue {
    const form = this.initializeForm(mealSlots);

    const nameParts = subscriber.name.split(' ');
    form.firstName = nameParts[0] || '';
    form.lastName = nameParts.slice(1).join(' ') || '';

    form.email = subscriber.email || '';
    form.roll_number = subscriber.roll_number !== 'N/A' ? subscriber.roll_number : '';
    form.superUser = !!subscriber.superUser;

    form.mealSlot.selectedMeals = (subscriber.mealNames || [])
      .map(mealName => {
        const slot = mealSlots.find(s => s.name.toLowerCase() === mealName.toLowerCase());
        return slot ? slot.name.toLowerCase() : '';
      })
      .filter(Boolean);

    form.mealSlot.dayPreference = subscriber.dayPreference || 'all';
    form.mealSlot.status = subscriber.status || 'Active';

    if (subscriber.status === 'Paused') {
      if (subscriber.pauseEndDate) form.pauseEndDate = subscriber.pauseEndDate;
      if (subscriber.pauseStartDate) form.pauseStartDate = subscriber.pauseStartDate;
      if (subscriber.pauseReason) form.pauseReason = subscriber.pauseReason;
    }

    if (subscriber.startDate && subscriber.endDate) {
      form.mealSlot.startDate = subscriber.startDate;
      form.mealSlot.endDate = subscriber.endDate;
    } else if (subscriber.joinedDate) {
      const dateStr = subscriber.joinedDate;
      const parts = dateStr.split(' ');
      if (parts.length >= 3) {
        const d = parts[0].padStart(2, '0');
        const monthIndex = months.findIndex(month =>
          month.toLowerCase().startsWith(parts[1].toLowerCase())
        );
        const m = (monthIndex >= 0 ? monthIndex + 1 : 1).toString().padStart(2, '0');
        const y = parts[2].slice(-2);
        form.mealSlot.startDate = `${d}/${m}/${y}`;

        let mNum = parseInt(m, 10);
        let yNum = parseInt(y, 10);
        mNum++;
        if (mNum > 12) {
          mNum = 1;
          yNum++;
        }
        form.mealSlot.endDate = `${d}/${mNum.toString().padStart(2, '0')}/${yNum.toString().padStart(2, '0')}`;
      }
    }

    return form;
  }

  resetForm(form: SubscriberFormValue, mealSlots: MealSlotWithCode[]): void {
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.roll_number = '';
    form.superUser = false;
    form.mealSlot.startDate = '';
    form.mealSlot.endDate = '';
    form.mealSlot.status = 'Active';
    form.mealSlot.selectedMeals = [];
    form.mealSlot.dayPreference = 'all';
    form.pauseEndDate = '';
    form.pauseStartDate = '';
    form.pauseReason = '';
  }
}
