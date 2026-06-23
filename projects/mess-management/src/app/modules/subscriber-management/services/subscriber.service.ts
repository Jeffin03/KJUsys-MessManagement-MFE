import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap, switchMap } from 'rxjs/operators';
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
    pauseStart_Date?: number;
    pauseEnd_Date?: number;
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
      // Check if subscription has expired based on end date
      const endDate = new Date(student.subscription.end_Date);
      const now = new Date();

      if (endDate < now) {
        // Subscription has expired
        status = 'Lapsed';
      } else if (student.subscription.active) {
        // Subscription is active and not expired
        status = 'Active';
      } else {
        // Subscription is explicitly paused (not active but not expired)
        status = 'Paused';
      }
    }

      // Format end_Date for the form (DD/MM/YY)
      let endDateString = '';
      if (student.subscription?.end_Date) {
        const endDate = new Date(student.subscription.end_Date);
        const ed = String(endDate.getDate()).padStart(2, '0');
        const em = String(endDate.getMonth() + 1).padStart(2, '0');
        const ey = String(endDate.getFullYear()).slice(-2);
        endDateString = `${ed}/${em}/${ey}`;
      }

      let pauseEndDateString = undefined;
      if (student.subscription?.pauseEnd_Date) {
        const ped = new Date(student.subscription.pauseEnd_Date);
        const pd = String(ped.getDate()).padStart(2, '0');
        const pm = String(ped.getMonth() + 1).padStart(2, '0');
        const py = String(ped.getFullYear()).slice(-2);
        pauseEndDateString = `${pd}/${pm}/${py}`;
      }

    return {
      id: student._id.$oid,
      name: student.name,
      email: student.email,
      roll_number: (student as any).roll_number || (student as any).rollNumber || (student as any).hmsId || student.uid || 'N/A',
      mealPlan: mealPlanStr || 'None',
      status: status,
      joinedDate: dateString,
      startDate: dateString, // For form, start date is same as joinedDate
      endDate: endDateString,
      pauseEndDate: pauseEndDateString
    };
  }

  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<ApiResponse<{ students: BackendStudent[] }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}`)
      .pipe(
        map(res => {
          const students = res.responseData?.data?.students || [];
          return students.map(s => this.mapToSubscriber(s));
        })
      );
  }

  getSubscriberById(id: number | string): Observable<Subscriber> {
    return this.http.get<ApiResponse<{ student: BackendStudent }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(id)}`)
      .pipe(
        map(res => this.mapToSubscriber(res.responseData.data.student))
      );
  }

  deleteSubscriber(roll_number: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(roll_number)}`);
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
        })
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
      subscription: {
        meals: meals,
        start_Date: startDateTs,
        end_Date: endDateTs,
        active: formData.mealSlot.status !== 'Paused',
        duration_days: durationDays,
        pauseStart_Date: null,
        pauseEnd_Date: null
      }
    };

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}`, payload);
  }

  assignHmsId(roll_number: string, studentId: string): Observable<any> {
    const payload = { studentId: studentId };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.RFID_REASSIGN(roll_number)}`, payload);
  }

  updateSubscriber(roll_number: string, formData: any, id: string | number): Observable<any> {
    // First, fetch the existing student data to preserve pause dates correctly
    return this.http.get<ApiResponse<{ student: any }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(roll_number)}`).pipe(
      switchMap((existingRes: ApiResponse<{ student: any }>) => {
        const existingStudent = existingRes.responseData?.data?.student;

        const meals = [];
        if (formData.mealSlot.breakfast) meals.push('BREAKFAST');
        if (formData.mealSlot.brunch) meals.push('BRUNCH');
        if (formData.mealSlot.lunch) meals.push('LUNCH');
        if (formData.mealSlot.snacks) meals.push('SNACKS');
        if (formData.mealSlot.dinner) meals.push('DINNER');

        // Convert 'DD/MM/YY' to timestamp
        const parseDate = (dateStr: string) => {
          if (!dateStr) return 0;
          const [d, m, y] = dateStr.split('/');
          return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
        };

        const startDateTs = parseDate(formData.mealSlot.startDate);
        const endDateTs = parseDate(formData.mealSlot.endDate);
        const durationDays = startDateTs && endDateTs ? Math.round((endDateTs - startDateTs) / (1000 * 60 * 60 * 24)) : 30;

        // Prepare subscription object with existing values as defaults
        const subscription: any = {
          meals: meals,
          start_Date: startDateTs,
          end_Date: endDateTs,
          active: formData.mealSlot.status !== 'Paused',
          duration_days: durationDays
        };

        // Handle pause dates by comparing existing and form data
        const existingPauseStart = existingStudent?.subscription?.pauseStart_Date;
        const existingPauseEnd = existingStudent?.subscription?.pauseEnd_Date;
        const formPauseEndDate = formData.pauseEndDate;
        const formStatus = formData.mealSlot.status;

        // Parse form pause end date if provided
        const formPauseEndTimestamp = formPauseEndDate ? parseDate(formPauseEndDate) : null;

        // Determine what to do with pause dates:
        if (formStatus === 'Paused' && formPauseEndTimestamp !== null) {
          // User wants to set/update a pause end date
          // Check if this is a new pause or an extension of an existing pause
          const isCurrentlyPaused = existingPauseStart !== null && existingPauseEnd !== null &&
            Date.now() >= existingPauseStart && Date.now() <= existingPauseEnd;

          if (isCurrentlyPaused) {
            // Extending an existing pause: keep original pause start date, update end date
            subscription.pauseStart_Date = existingPauseStart;
            subscription.pauseEnd_Date = formPauseEndTimestamp;
          } else {
            // Starting a new pause (either not currently paused or pause has ended)
            // Set pause start to current time
            subscription.pauseStart_Date = Date.now();
            subscription.pauseEnd_Date = formPauseEndTimestamp;
          }
        } else if (formStatus !== 'Paused') {
          // User wants to end any pause (set status to Active/Lapsed)
          subscription.pauseStart_Date = null;
          subscription.pauseEnd_Date = null;
        }
        // Else: status is Paused but no pause end date provided
        // Preserve existing pause dates (do nothing)

        const payload = {
          _id: { $oid: id.toString() },
          roll_number: formData.roll_number,
          uid: formData.roll_number,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          subscription: subscription
        };

        // Use roll_number for the endpoint (backend expects roll_number, not MongoDB _id)
        return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ID(roll_number)}`, payload);
      })
    );
  }

  pauseSubscription(roll_number: string, pauseEndDate: string): Observable<any> {
    // Convert pauseEndDate to timestamp
    const pauseEndTimestamp = new Date(pauseEndDate).getTime();

    const payload = {
      pauseEndDate: pauseEndTimestamp
    };

    // Use roll_number for the endpoint (backend expects roll_number, not MongoDB _id)
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_PAUSE(roll_number)}`, payload);
  }
}
