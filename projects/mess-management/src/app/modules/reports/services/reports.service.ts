import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { compareMealStartTimes, mealNameToMinutes } from '../../../shared/constants/meal-sort';
import {
  TapRecord, AttendanceDay, HolidayRecord, ChangelogEntry,
  StudentOverview, DailyAnalytics,
  ReportsResponse, PaginatedResponse
} from '../models/reports.models';

function extractId(rawId: any): string {
  if (!rawId) return '';
  if (typeof rawId === 'string') return rawId;
  if (typeof rawId === 'object' && rawId.$oid) return rawId.$oid;
  return String(rawId);
}

function formatMealLabel(meal: string): string {
  return meal.charAt(0) + meal.slice(1).toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  private extractData<T>(response: ReportsResponse<T>): T {
    return response.responseData.data;
  }

  getStudentTaps(rollNumber: string, from?: string, to?: string): Observable<TapRecord[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_TAPS(rollNumber)}`, { params })
      .pipe(map(r => {
        const data = this.extractData(r);
        const raw = data && data.taps ? data.taps : [];
        return raw.map((t: any) => ({
          id: extractId(t._id),
          rollNumber: t.roll_number || '',
          mealSlot: t.meal ? formatMealLabel(t.meal) : '',
          tapTimestamp: t.tap_DateTime || 0,
          date: t.tap_Date || 0,
        }));
      }));
  }

  getStudentAttendance(rollNumber: string, from?: string, to?: string): Observable<AttendanceDay[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_ATTENDANCE(rollNumber)}`, { params })
      .pipe(map(r => {
        const data = this.extractData(r);
        const records = data && data.records ? data.records : [];

        function toLocalDateStr(ts: number): string {
          const d = new Date(ts);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const dayMap = new Map<string, { slots: { slotName: string; status: string }[] }>();
        records.forEach((rec: any) => {
          let dayKey = rec.date || '';
          if (rec.dayStart) {
            const localDate = toLocalDateStr(Number(rec.dayStart));
            if (localDate !== dayKey) {
              dayKey = localDate;
            }
          }
          if (!dayMap.has(dayKey)) dayMap.set(dayKey, { slots: [] });
          dayMap.get(dayKey)!.slots.push({
            slotName: rec.mealSlot ? formatMealLabel(rec.mealSlot) : '',
            status: rec.status || 'absent',
          });
        });

        const result: AttendanceDay[] = [];
        dayMap.forEach((day, date) => {
          // Sort meal slots with 3am pivot
          day.slots.sort((a, b) => compareMealStartTimes(
            mealNameToMinutes(a.slotName),
            mealNameToMinutes(b.slotName)
          ));
          const statuses = day.slots.map(s => s.status);
          let overall: AttendanceDay['overall'] = 'absent';
          if (statuses.every(s => s === 'holiday')) overall = 'holiday';
          else if (statuses.every(s => s === 'paused')) overall = 'paused';
          else if (statuses.some(s => s === 'present')) {
            overall = statuses.every(s => s === 'present' || s === 'holiday') ? 'present' : 'partial';
          }

          result.push({
            date,
            mealSlots: day.slots.map(s => ({
              slotName: s.slotName,
              startTime: '',
              endTime: '',
              tapped: s.status === 'present',
              tapTime: s.status === 'present' ? 'Tapped' : undefined,
              isHoliday: s.status === 'holiday',
              isPaused: s.status === 'paused',
              isSubscriptionActive: s.status !== 'paused',
            })),
            overall,
          });
        });

        return result.sort((a, b) => b.date.localeCompare(a.date));
      }));
  }

  getStudentChangelog(rollNumber: string, limit?: number): Observable<ChangelogEntry[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_CHANGELOG(rollNumber)}`, { params })
      .pipe(map(r => {
        const data = this.extractData(r);
        const raw = data && data.logs ? data.logs : [];
        return raw.map((l: any) => {
          const prevMeals = l.previousValue?.meals;
          const newMeals = l.newValue?.meals;
          let description = l.reason || 'Details updated';
          if (!l.reason) {
            if (l.action === 'HOLIDAY_MARKED') {
              const count = l.newValue?.subscriptionsExtended ?? 0;
              description = count > 0
                ? `Holiday marked. ${count} subscription(s) extended by 1 day`
                : 'Holiday marked';
            } else if (l.action === 'PAUSE_STARTED') {
              const ps = l.newValue?.pauseStart_Date;
              const pe = l.newValue?.pauseEnd_Date;
              if (ps && pe) {
                description = `Paused: ${new Date(ps).toLocaleDateString()} → ${new Date(pe).toLocaleDateString()}`;
              } else {
                description = 'Subscription paused';
              }
            } else if (l.action === 'PAUSE_ENDED') {
              description = 'Subscription auto-resumed after pause period ended';
            } else if (l.action === 'PAUSE_EXTENDED') {
              const prevEnd = l.previousValue?.pauseEnd_Date;
              const newEnd = l.newValue?.pauseEnd_Date;
              if (prevEnd && newEnd) {
                description = `Pause extended: ${new Date(prevEnd).toLocaleDateString()} → ${new Date(newEnd).toLocaleDateString()}`;
              } else {
                description = 'Pause duration extended';
              }
            } else if (Array.isArray(prevMeals) && Array.isArray(newMeals)) {
              const added = newMeals.filter((m: string) => !prevMeals.includes(m));
              const removed = prevMeals.filter((m: string) => !newMeals.includes(m));
              const parts: string[] = [];
              if (added.length) parts.push(`Added: ${added.join(', ')}`);
              if (removed.length) parts.push(`Removed: ${removed.join(', ')}`);
              if (parts.length) description = parts.join(' | ');
            }
          }
          return {
            id: extractId(l._id),
            rollNumber: l.roll_number || '',
            action: l.action || '',
            description,
            timestamp: l.timestamp || 0,
            changedBy: l.changedBy || 'system',
          };
        });
      }));
  }

  getStudentPauseComp(rollNumber: string): Observable<any> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_PAUSE_COMP(rollNumber)}`)
      .pipe(map(r => this.extractData(r)));
  }

  getStudentSubscriptionHistory(rollNumber: string): Observable<any[]> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_SUBSCRIPTION_HISTORY(rollNumber)}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        const raw = data && data.records ? data.records : [];
        return raw.map((e: any) => ({
          timestamp: e.timestamp || 0,
          action: e.action || '',
          reason: e.reason || '',
          details: e.details || {},
        }));
      }));
  }

  private resolveNumeric(val: any): number {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object' && val.$numberLong) return Number(val.$numberLong);
    return Number(val) || 0;
  }

  getStudentOverview(rollNumber: string): Observable<StudentOverview> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(rollNumber)}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        const student = data && data.student ? data.student : data;
        const isSuperUser = !!student.superUser;
        const sub = student.subscription || {};

        const endDate = this.resolveNumeric(sub.end_Date);
        const effectiveEndDate = this.resolveNumeric(sub.effective_End_Date) || endDate;
        const pauseStart = this.resolveNumeric(sub.pauseStart_Date);
        const pauseEnd = this.resolveNumeric(sub.pauseEnd_Date);
        const startDate = this.resolveNumeric(sub.start_Date);
        const durationDays = this.resolveNumeric(sub.duration_days);

        const status = isSuperUser ? 'super_user' : (() => {
          const now = Date.now();
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayStartTs = todayStart.getTime();
          if (pauseStart && pauseEnd) {
            if (now >= pauseStart && now <= pauseEnd) return 'paused';
          }
          if (endDate && todayStartTs > endDate) return 'expired';
          const hasEndedPause = pauseStart && pauseEnd && todayStartTs > pauseEnd;
          if (hasEndedPause) return 'active';
          const hasFuturePause = pauseStart && pauseEnd && now < pauseStart;
          if (hasFuturePause) return 'active';
          return sub.active ? 'active' : 'expired';
        })();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTs = todayStart.getTime();

        const daysRemaining = endDate
          ? Math.max(0, Math.floor((effectiveEndDate - todayStartTs) / 86400000) + 1)
          : 0;

        const pausedDays = (pauseStart && pauseEnd)
          ? Math.max(0, Math.round((pauseEnd - pauseStart) / 86400000))
          : 0;

        const meals: string[] = sub.meals || [];
        const mealSlots = meals.map(formatMealLabel);

        return {
          rollNumber: student.roll_number || '',
          name: student.name || '',
          email: student.email || '',
          cardStatus: 'Active',
          dayPreference: student.dayPreference || 'all',
          superUser: isSuperUser,
          subscription: isSuperUser ? undefined : {
            currentPlan: mealSlots.join(' + ') || 'None',
            startDate,
            endDate,
            status,
            daysRemaining,
            totalDays: durationDays,
            pausedDays,
            mealSlots,
          },
          totalTaps: 0,
          attendanceRate: 0,
        };
      }));
  }

  getChangelog(paramsMap: {
    action?: string; roll_number?: string; from?: string; to?: string; page?: number; size?: number;
  }): Observable<PaginatedResponse<ChangelogEntry>> {
    let params = new HttpParams();
    Object.entries(paramsMap).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, v.toString());
    });
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.CHANGELOG}`, { params })
      .pipe(map(r => {
        const data = this.extractData(r);
        const raw = data && data.logs ? data.logs : [];
        const mapped = raw.map((l: any) => ({
          id: extractId(l._id),
          rollNumber: l.roll_number || '',
          action: l.action || '',
          description: l.reason || (l.newValue ? 'Details updated' : ''),
          timestamp: l.timestamp || 0,
          changedBy: l.changedBy || 'system',
        }));
        return {
          data: mapped,
          total: data?.total || mapped.length,
          page: data?.page || 0,
          size: data?.size || mapped.length,
          totalPages: data?.totalPages || 1,
        };
      }));
  }

  getHolidays(): Observable<HolidayRecord[]> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.HOLIDAYS_LIST}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        const raw = data && data.holidays ? data.holidays : [];
        return raw.map((h: any) => ({
          id: extractId(h._id),
          date: h.date_Date || 0,
          reason: h.reason || '',
        }));
      }));
  }

  createHoliday(dateMillis: number, reason: string): Observable<any> {
    return this.http
      .post<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_HOLIDAY}`, { date_Date: dateMillis, reason })
      .pipe(map(r => this.extractData(r)));
  }

  deleteHoliday(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}${API_ENDPOINTS.HOLIDAY_BY_ID(id)}`);
  }

  getPauseAudit(): Observable<any[]> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS_PAUSE_AUDIT}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        return data && data.audit ? data.audit : [];
      }));
  }

  getAnomalies(hours: number = 48): Observable<any[]> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS_ANOMALIES}?hours=${hours}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        return data && data.anomalies ? data.anomalies : [];
      }));
  }

  triggerExport(): Observable<any> {
    return this.http
      .post<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS_EXPORT_TRIGGER}`, {})
      .pipe(map(r => this.extractData(r)));
  }

  triggerFilteredExport(params: {
    type: string;
    format: string;
    roll_number?: string;
    from?: number;
    to?: number;
    mealSlots?: string[];
    statuses?: string[];
    rollNumbers?: string[];
    includeSummary?: boolean;
    includeDetail?: boolean;
  }): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}${API_ENDPOINTS.REPORTS_EXPORT_TRIGGER}`,
      params,
      { responseType: 'blob' }
    );
  }

  listExports(): Observable<any[]> {
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS_EXPORTS}`)
      .pipe(map(r => {
        const data = this.extractData(r);
        return data && data.exports ? data.exports : [];
      }));
  }

  getAnalyticsDashboard(from?: string, to?: string): Observable<DailyAnalytics> {
    let params = '';
    if (from && to) params = `?from=${from}&to=${to}`;
    return this.http
      .get<ReportsResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS_ANALYTICS}${params}`)
      .pipe(map(r => {
        const raw = this.extractData(r);
        const dist = raw?.mealDistribution || [];
        return {
          totalTaps: raw?.totalTaps || 0,
          totalActiveSubscribers: raw?.totalActiveSubscribers || 0,
          expectedActiveToday: raw?.expectedActiveToday ?? (raw?.totalActiveSubscribers || 0),
          absentCount: raw?.absentCount || 0,
          pausedCount: raw?.pausedCount || 0,
          expiredCount: raw?.expiredCount || 0,
          mealDistribution: dist.map((m: any) => ({
            slotName: formatMealLabel(m.slotName),
            tapCount: m.tapCount || 0,
            subscriberCount: m.subscriberCount || 0,
          })),
        };
      }));
  }
}
