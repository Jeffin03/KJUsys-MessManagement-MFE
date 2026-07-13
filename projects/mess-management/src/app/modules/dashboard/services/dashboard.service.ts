import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { MealSlot, MealEntry, HardwareDevice } from '../../../shared/models/dashboard.models';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { environment } from '../../../../environments/environment';
import { timeToMinutes, compareMealStartTimes } from '../../../shared/constants/meal-sort';

export interface HolidayRecord {
  id: string;
  date: string;
  reason: string;
  createdAt?: string;
}

export interface BackendSchedule {
  _id: { $oid: string };
  meal: string;
  code: string;
  icon: string;
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

export interface TokenSection {
  text: string;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  dividerAfter?: boolean;
}

export interface DisplayConfig {
  meal: string;
  lcd_line1?: string;
  lcd_line2?: string;
  defaultMsg: { line1: string; line2: string };
  tapAllowed: { line1: string; line2: string };
  alreadyTapped: { line1: string; line2: string };
  notSubscribed: { line1: string; line2: string };
  tokenConfig?: {
    sections: TokenSection[];
  };
}

export interface DisplayConfigResponse {
  configs: DisplayConfig[];
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
              code: m.code || '',
              icon: m.icon || m.meal.toLowerCase(),
              status: status,
              timeRange: `${m.start} - ${m.end}`,
              total: 0,
              hadMeal: null,
              thirdStat: null,
              thirdLabel: status === 'Closed' ? 'Skipped' : 'Pending',
              startTime: m.start
            };
           }).sort((a, b) => compareMealStartTimes(timeToMinutes(a.startTime), timeToMinutes(b.startTime)));
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

          function formatTapTime(ts: any): string {
            if (!ts) return '--:--';
            if (typeof ts === 'object' && ts?.$numberLong) ts = Number(ts.$numberLong);
            const num = typeof ts === 'number' ? ts : Number(ts);
            if (!isNaN(num)) {
              const d = new Date(num);
              if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return '--:--';
          }

          return sortedTaps.map(t => ({
            customer: t.name,
            roll_number: t.roll_number || 'N/A',
            mealSlot: t.meal.charAt(0) + t.meal.slice(1).toLowerCase() as any,
            time: formatTapTime(t.tap_DateTime),
            status: 'Allowed' as 'Allowed' | 'Not Subscribed'
          }));
        }),
        shareReplay({ bufferSize: 1, windowTime: this.CACHE_DURATION, refCount: true })
      );
  }

  getHardwareStatus(bypassCache: boolean = false): Observable<{ hardware: HardwareDevice[], serverUptimeSeconds: number, responseTimeMs: number }> {
    const request = this.http.get<ApiResponse<{ hardware: HardwareDevice[], serverUptimeSeconds: number, responseTimeMs: number }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_STATUS}`)
      .pipe(
        map(res => {
          const hardware = res.responseData?.data?.hardware || [];
          const serverUptimeSeconds = res.responseData?.data?.serverUptimeSeconds || 0;
          const responseTimeMs = res.responseData?.data?.responseTimeMs || 0;
          return {
            hardware: hardware.map(h => ({
              deviceId: h.deviceId,
              name: h.name,
              icon: h.icon,
              status: h.status as HardwareDevice['status'],
              lastSeenMs: h.lastSeenMs
            })),
            serverUptimeSeconds,
            responseTimeMs
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

  getDisplayConfigs(): Observable<DisplayConfig[]> {
    return this.http.get<ApiResponse<{ configs: DisplayConfig[] }>>(`${this.baseUrl}${API_ENDPOINTS.DISPLAY_CONFIG}`)
      .pipe(
        map(res => res.responseData?.data?.configs || [])
      );
  }

  getDisplayConfigByMeal(meal: string): Observable<DisplayConfig> {
    return this.http.get<ApiResponse<DisplayConfig>>(`${this.baseUrl}${API_ENDPOINTS.DISPLAY_CONFIG_BY_MEAL(meal)}`)
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  updateDisplayConfig(config: DisplayConfig): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.DISPLAY_CONFIG}`, config);
  }

  // ── Holidays ────────────────────────────────────────────────────────────

  getHolidays(): Observable<HolidayRecord[]> {
    return this.http.get<any>(`${this.baseUrl}${API_ENDPOINTS.HOLIDAYS_LIST}`)
      .pipe(
        map(res => {
          const data = res.responseData?.data;
          let items: any[] = [];
          if (Array.isArray(data)) items = data;
          else if (data?.holidays) items = data.holidays;
          else if (data?.results) items = data.results;
          return items.map((h: any) => ({
            id: h._id || h.id || '',
            date: parseBackendDate(h.date_Date),
            reason: h.reason || '',
          }));
        })
      );
  }

  createHoliday(dateMillis: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_HOLIDAY}`, { date_Date: dateMillis, reason });
  }

  deleteHoliday(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.HOLIDAY_BY_ID(id)}`);
  }
}

function parseBackendDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') return String(val);
  const parts = val.split('-');
  if (parts.length === 3) {
    return String(new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime());
  }
  return val;
}