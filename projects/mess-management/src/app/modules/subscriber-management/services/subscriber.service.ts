import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { Subscriber } from '../../../shared/models/subscriber';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { environment } from '../../../../environments/environment';

export interface BackendStudent {
  _id: { $oid: string };
  name: string;
  roll_number: string;
  uid?: string;
  email: string;
  subscription: {
    meals: string[];
    start_Date: number;
    end_Date: number;
    duration_days: number;
    active: boolean;
    days_remaining: number;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  type: string;
  responseData: {
    data: T;
    message: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubscriberService {
  private baseUrl = environment.baseUrl;

  // Cache duration in milliseconds (5 minutes for subscriber data - less frequent changes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor(private http: HttpClient) { }

  private mapToSubscriber(student: BackendStudent): Subscriber {
    // Convert timestamp to date string (e.g., '10 Jan 26')
    const date = new Date(student.subscription?.start_Date || Date.now());
    const dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

    // Map meals array to 'B+BR+L+S+D' format
    const mealPlanMap: { [key: string]: string } = {
      'BREAKFAST': 'B',
      'BRUNCH': 'BR',
      'LUNCH': 'L',
      'SNACKS': 'S',
      'DINNER': 'D'
    };
    const mealsArray = student.subscription?.meals || [];
    const mealPlanStr = mealsArray.map((m: string) => mealPlanMap[m] || m).join('+');

    let status: 'Active' | 'Paused' | 'Lapsed' = 'Lapsed';
    if (student.subscription) {
      if (student.subscription.active) {
        status = 'Active';
      }
    }

    return {
      id: student._id.$oid,
      name: student.name,
      email: student.email,
      roll_number: (student as any).roll_number || (student as any).rollNumber || (student as any).hmsId || student.uid || 'N/A',
      mealPlan: mealPlanStr || 'None',
      status: status,
      joinedDate: dateString
    };
  }

  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<ApiResponse<{ students: BackendStudent[] }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}`)
      .pipe(
        map(res => {
          const students = res.responseData?.data?.students || [];
          return students.map(s => this.mapToSubscriber(s));
        }),
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
  }

  getSubscriberById(id: number | string): Observable<Subscriber> {
    return this.http.get<ApiResponse<{ student: BackendStudent }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(id)}`)
      .pipe(
        map(res => this.mapToSubscriber(res.responseData.data.student)),
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
  }

  renewSubscriber(id: number | string, duration_days: number = 30): Observable<any> {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.STUDENT_RENEW(id)}`, { duration_days });
  }

  getExpiringSubscribers(): Observable<Subscriber[]> {
    return this.http.get<ApiResponse<{ students: BackendStudent[] }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS_EXPIRING}`)
      .pipe(
        map(res => {
          const students = res.responseData?.data?.students || [];
          return students.map(s => this.mapToSubscriber(s));
        }),
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
  }

  createSubscriber(formData: any): Observable<any> {
    const meals: string[] = [];
    Object.keys(formData.mealSlot).forEach(key => {
      if (!['startDate', 'endDate', 'status'].includes(key) && formData.mealSlot[key]) {
        meals.push(key.toUpperCase());
      }
    });

    // Convert 'DD/MM/YY' to timestamp
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      const [d, m, y] = dateStr.split('/');
      return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
    };

    const startDateTs = parseDate(formData.mealSlot.startDate);
    const endDateTs = parseDate(formData.mealSlot.endDate);
    const durationDays = startDateTs && endDateTs ? Math.round((endDateTs - startDateTs) / (1000 * 60 * 60 * 24)) : 30;

    const payload = {
      roll_number: formData.roll_number,
      uid: formData.roll_number,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      meals: meals,
      duration_days: durationDays > 0 ? durationDays : 30,
      subscription: {
        meals: meals,
        start_Date: startDateTs,
        end_Date: endDateTs,
        active: formData.mealSlot.status !== 'Paused',
        duration_days: durationDays > 0 ? durationDays : 30
      }
    };

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}`, payload);
  }

  assignHmsId(roll_number: string, studentId: string): Observable<any> {
    const payload = { studentId: studentId };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.RFID_REASSIGN(roll_number)}`, payload);
  }

  updateSubscriber(id: string | number, formData: any): Observable<any> {
    const meals: string[] = [];
    Object.keys(formData.mealSlot).forEach(key => {
      if (!['startDate', 'endDate', 'status'].includes(key) && formData.mealSlot[key]) {
        meals.push(key.toUpperCase());
      }
    });

    // Convert 'DD/MM/YY' to timestamp
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      const [d, m, y] = dateStr.split('/');
      return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
    };

    const startDateTs = parseDate(formData.mealSlot.startDate);
    const endDateTs = parseDate(formData.mealSlot.endDate);
    const durationDays = startDateTs && endDateTs ? Math.round((endDateTs - startDateTs) / (1000 * 60 * 60 * 24)) : 30;

    const payload = {
      roll_number: formData.roll_number,
      uid: formData.roll_number,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      meals: meals,
      duration_days: durationDays > 0 ? durationDays : 30,
      subscription: {
        meals: meals,
        start_Date: startDateTs,
        end_Date: endDateTs,
        active: formData.mealSlot.status !== 'Paused',
        duration_days: durationDays > 0 ? durationDays : 30
      }
    };

    return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(id)}`, payload);
  }
}
