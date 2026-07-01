import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap, switchMap } from 'rxjs/operators';
import { Subscriber } from '../../../shared/models/subscriber';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { environment } from '../../../../environments/environment';
import { MealSlotService } from '../../../shared/services/meal-slot.service';

export interface BackendStudent {
  _id: { $oid: string };
  name: string;
  roll_number: string;
  uid?: string;
  email: string;
  pauseReason?: string;
  subscription: {
    meals: string[];
    start_Date: number;
    end_Date: number;
    duration_days: number;
    active: boolean;
    days_remaining: number;
    pauseStart_Date?: number;
    pauseEnd_Date?: number;
    is_Paused?: boolean;
    effective_End_Date?: number;
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

  constructor(
    private http: HttpClient,
    private mealSlotService: MealSlotService
  ) { }

  private mapToSubscriber(student: BackendStudent): Subscriber {
    // Convert timestamp to date string (e.g., '10 Jan 26')
    const date = new Date(student.subscription?.start_Date || Date.now());
    const dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

    // Use admin-defined meal codes from MealSlotService — filter out deleted slots
    const mealsArray = student.subscription?.meals || [];
    const mealSlots = this.mealSlotService.getMealSlotsSync();
    const mealPlanStr = mealsArray.map((m: string) => {
      const slot = mealSlots.find(s => s.name.toUpperCase() === m.toUpperCase());
      return slot?.code || null;
    }).filter(Boolean).join('+');

    let status: 'Active' | 'Paused' | 'Lapsed' = 'Lapsed';
    if (student.subscription) {
      const now = new Date();

      // Use effective_End_Date if available (accounts for pause extensions), else fall back to end_Date
      const effectiveEnd = student.subscription.effective_End_Date || student.subscription.end_Date;
      const effectiveEndDate = new Date(effectiveEnd);

      if (effectiveEndDate < now) {
        status = 'Lapsed';
      } else {
        const pauseEnd = student.subscription.pauseEnd_Date;
        const pauseEndDate = pauseEnd ? new Date(pauseEnd) : null;
        const pauseExpired = pauseEndDate && pauseEndDate <= now;

        if (pauseExpired) {
          status = 'Active';
        } else if (student.subscription.is_Paused || pauseEndDate) {
          status = 'Paused';
        } else if (student.subscription.active) {
          status = 'Active';
        } else {
          status = 'Paused';
        }
      }
    }

    // Compute expiry warning (only for active subscribers within 7 days)
    let expiryWarning = '';
    if (status === 'Active' && student.subscription) {
      const effectiveEnd = student.subscription.effective_End_Date || student.subscription.end_Date;
      const now = Date.now();
      const daysUntilExpiry = Math.ceil((effectiveEnd - now) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        expiryWarning = `expiry in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`;
      }
    }

      // Format dates for the form (DD/MM/YY)
      let startDateString = '';
      let endDateString = '';
      if (student.subscription?.start_Date) {
        const startDate = new Date(student.subscription.start_Date);
        const sd = String(startDate.getDate()).padStart(2, '0');
        const sm = String(startDate.getMonth() + 1).padStart(2, '0');
        const sy = String(startDate.getFullYear()).slice(-2);
        startDateString = `${sd}/${sm}/${sy}`;
      }
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

      let pauseStartDateString = undefined;
      if (student.subscription?.pauseStart_Date) {
        const psd = new Date(student.subscription.pauseStart_Date);
        const psd_d = String(psd.getDate()).padStart(2, '0');
        const psd_m = String(psd.getMonth() + 1).padStart(2, '0');
        const psd_y = String(psd.getFullYear()).slice(-2);
        pauseStartDateString = `${psd_d}/${psd_m}/${psd_y}`;
      }

    return {
      id: student._id.$oid,
      name: student.name,
      email: student.email,
      roll_number: student.roll_number || 'N/A',
      mealPlan: mealPlanStr || 'None',
      status: status,
      joinedDate: dateString,
      startDate: startDateString,
      endDate: endDateString,
      pauseEndDate: pauseEndDateString,
      pauseStartDate: pauseStartDateString,
      pauseReason: student.pauseReason,
      expiryWarning: expiryWarning,
      mealNames: mealsArray
    };
  }

  getSubscribers(search = '', page = 0, size = 50, plan = '', status = ''): Observable<{ subscribers: Subscriber[], total: number }> {
    let params = new HttpParams()
      .set('search', search)
      .set('page', page)
      .set('size', size);
    
    if (plan) params = params.set('plan', plan);
    if (status) params = params.set('status', status);

    const request = this.http.get<ApiResponse<{ students: BackendStudent[] }>>(
      `${this.baseUrl}${API_ENDPOINTS.STUDENTS}`, { params }
    ).pipe(
      map(res => {
        const responseData = res.responseData?.data as any;
        const students = responseData?.students || [];
        const total = responseData?.total ?? responseData?.totalCount ?? responseData?.count ?? students.length;
        return {
          subscribers: students.map((s: BackendStudent) => this.mapToSubscriber(s)),
          total
        };
      })
    );

    if (!search && !plan && !status && page === 0) {
      return request.pipe(
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
    }
    return request;
  }

  getSubscriberById(roll_number: string): Observable<Subscriber> {
    return this.http.get<ApiResponse<{ student: BackendStudent }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(roll_number)}`)
      .pipe(
        map(res => this.mapToSubscriber(res.responseData.data.student))
      );
  }

  deleteSubscriber(roll_number: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(roll_number)}`);
  }

  renewSubscriber(roll_number: string, duration_days: number = 30): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.STUDENT_RENEW(roll_number)}`, { duration_days });
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

    const pauseStartTs = formData.pauseStartDate ? parseDate(formData.pauseStartDate) : null;
    const pauseEndTs = formData.pauseEndDate ? parseDate(formData.pauseEndDate) : null;

    const payload: any = {
      roll_number: formData.roll_number,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      subscription: {
        meals: meals,
        start_Date: startDateTs,
        end_Date: endDateTs,
        active: formData.mealSlot.status !== 'Paused',
        duration_days: durationDays,
        pauseStart_Date: pauseStartTs,
        pauseEnd_Date: pauseEndTs
      }
    };

    if (formData.pauseReason) {
      payload.pauseReason = formData.pauseReason;
    }

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}`, payload);
  }

  updateSubscriber(roll_number: string, formData: any): Observable<any> {
    // First, fetch the existing student data to preserve pause dates correctly
    return this.http.get<ApiResponse<{ student: any }>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(roll_number)}`).pipe(
      switchMap((existingRes: ApiResponse<{ student: any }>) => {
        const existingStudent = existingRes.responseData?.data?.student;

        // Dynamic meal slots - same logic as createSubscriber
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
        const formPauseStartDate = formData.pauseStartDate;
        const formStatus = formData.mealSlot.status;

        // Parse form pause dates if provided
        const formPauseEndTimestamp = formPauseEndDate ? parseDate(formPauseEndDate) : null;
        const formPauseStartTimestamp = formPauseStartDate ? parseDate(formPauseStartDate) : null;

        // Determine what to do with pause dates:
        if (formStatus === 'Paused' && formPauseEndTimestamp !== null) {
          if (formPauseStartTimestamp !== null) {
            subscription.pauseStart_Date = formPauseStartTimestamp;
            subscription.pauseEnd_Date = formPauseEndTimestamp;
          } else {
            const isCurrentlyPaused = existingPauseStart !== null && existingPauseEnd !== null &&
              Date.now() >= existingPauseStart && Date.now() <= existingPauseEnd;
            if (isCurrentlyPaused) {
              subscription.pauseStart_Date = existingPauseStart;
              subscription.pauseEnd_Date = formPauseEndTimestamp;
            } else {
              subscription.pauseStart_Date = Date.now();
              subscription.pauseEnd_Date = formPauseEndTimestamp;
            }
          }
        } else if (formStatus !== 'Paused') {
          // Resuming from pause — extend end date by the pause duration
          if (existingPauseStart && existingPauseEnd) {
            const pauseDurationMs = existingPauseEnd - existingPauseStart;
            const newEndTs = endDateTs + pauseDurationMs;
            subscription.end_Date = newEndTs;
            subscription.duration_days = Math.round((newEndTs - startDateTs) / (1000 * 60 * 60 * 24));
          }
          subscription.pauseStart_Date = null;
          subscription.pauseEnd_Date = null;
          subscription.active = true;
        }

        const payload: any = {
          roll_number: formData.roll_number,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          subscription: subscription
        };

        if (formData.pauseReason) {
          payload.pauseReason = formData.pauseReason;
        }

        // Use roll_number for the endpoint (backend expects roll_number, not MongoDB _id)
        return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(roll_number)}`, payload);
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
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_PAUSE(roll_number)}`, payload);
  }
}
