import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { MealSlot, MealEntry, HardwareDevice } from '../../../shared/models/dashboard.models';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { environment } from '../../../../environments/environment';

export interface BackendSchedule {
  _id: { $oid: string };
  meal: string;
  active: boolean;
  schedule: {
    weekday: { start: string; end: string };
    weekend: { start: string; end: string };
    holiday: { start: string; end: string };
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
export class DashboardService {
  private baseUrl = environment.baseUrl;

  // Cache duration in milliseconds (2 minutes for dashboard data)
  private readonly CACHE_DURATION = 2 * 60 * 1000;

  constructor(private http: HttpClient) { }

  getSchedules(bypassCache: boolean = false): Observable<MealSlot[]> {
    const request = this.http.get<ApiResponse<{ date: string, day_type: string, meals: any[] }>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_TODAY}`)
      .pipe(
        map(res => {
          const meals = res.responseData?.data?.meals || [];
          return meals.map(m => {
            const now = new Date();
            const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            let status: 'Closed' | 'Live' | 'Upcoming' = 'Upcoming';
            if (currentHourStr >= m.start && currentHourStr <= m.end) status = 'Live';
            else if (currentHourStr > m.end) status = 'Closed';

            return {
              name: m.meal.charAt(0) + m.meal.slice(1).toLowerCase(),
              icon: m.meal.toLowerCase(),
              status: status,
              timeRange: `${m.start} - ${m.end}`,
              total: 0,
              hadMeal: null,
              thirdStat: null,
              thirdLabel: status === 'Closed' ? 'Skipped' : 'Pending',
              startTime: m.start
            };
          }).sort((a, b) => a.startTime.localeCompare(b.startTime));
        })
      );

    return bypassCache ? request : request.pipe(
      shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
    );
  }

  getTaps(): Observable<MealEntry[]> {
    return this.http.get<ApiResponse<{ taps: any[] }>>(`${this.baseUrl}${API_ENDPOINTS.TAPS}`)
      .pipe(
        map(res => {
          const taps = res.responseData?.data?.taps || [];

          // Latest tap first — sort by raw timestamp, not the formatted display
          // string (formatted "hh:mm AM/PM" strings sort incorrectly across noon)
          const sortedTaps = [...taps].sort((a, b) => {
            const aTime = a.tap_DateTime ?? a.tap_Date ?? 0;
            const bTime = b.tap_DateTime ?? b.tap_Date ?? 0;
            return bTime - aTime;
          });

          return sortedTaps.map(t => ({
            customer: t.name,
            roll_number: t.roll_number || t.rollNumber || t.hmsId || t.uid || 'N/A',
            mealSlot: t.meal.charAt(0) + t.meal.slice(1).toLowerCase() as any,
            time: new Date(t.tap_DateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Allowed' as 'Allowed' | 'Not Subscribed'
          }));
        }),
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
  }

  getHardwareStatus(bypassCache: boolean = false): Observable<{ hardware: HardwareDevice[], serverUptimeSeconds: number }> {
    const request = this.http.get<ApiResponse<{ hardware: HardwareDevice[], serverUptimeSeconds: number }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_STATUS}`)
      .pipe(
        map(res => {
          const hardware = res.responseData?.data?.hardware || [];
          const serverUptimeSeconds = res.responseData?.data?.serverUptimeSeconds || 0;
          return {
            hardware: hardware.map(h => ({
              deviceId: h.deviceId,
              name: h.name,
              icon: h.icon,
              status: h.status as HardwareDevice['status'],
              lastSeenMs: h.lastSeenMs
            })),
            serverUptimeSeconds
          };
        })
      );

    return bypassCache ? request : request.pipe(
      shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
    );
  }

  createSchedule(payload: any): Observable<ApiResponse<{ schedule: BackendSchedule }>> {
    return this.http.post<ApiResponse<{ schedule: BackendSchedule }>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE}`, payload);
  }

  deleteSchedule(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`);
  }

  getRawSchedules(): Observable<ApiResponse<{ schedules: BackendSchedule[] }>> {
    return this.http.get<ApiResponse<{ schedules: BackendSchedule[] }>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE}`);
  }

  updateSchedule(id: string, payload: any): Observable<ApiResponse<{ schedule: BackendSchedule }>> {
    return this.http.put<ApiResponse<{ schedule: BackendSchedule }>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`, payload);
  }
}