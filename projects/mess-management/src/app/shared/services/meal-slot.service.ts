import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, take, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { compareMealStartTimes } from '../constants/meal-sort';
import { computeMealSlotStatus } from './meal-slot-utils';

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

export interface MealSlotWithCode {
  id: string;
  name: string;
  code: string;
  icon: string;
  timeRange: string;
  status: 'Closed' | 'Live' | 'Upcoming' | 'Inactive';
  start24: string;
  end24: string;
  startTime: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MealSlotService {
  private baseUrl = environment.baseUrl;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private mealSlotsSubject = new BehaviorSubject<MealSlotWithCode[]>([]);
  public mealSlots$ = this.mealSlotsSubject.asObservable();

  private cacheTimestamp = 0;
  private isLoading = false;

  constructor(private http: HttpClient) {}

  getMealSlots(forceRefresh = false): Observable<MealSlotWithCode[]> {
    const now = Date.now();
    const isStale = now - this.cacheTimestamp > this.CACHE_DURATION;

    if (!forceRefresh && !isStale && this.mealSlotsSubject.value.length > 0) {
      return this.mealSlots$.pipe(take(1));
    }

    if (this.isLoading) {
      return this.mealSlots$.pipe(
        take(1),
        map(slots => slots)
      );
    }

    return this.fetchAndCache();
  }

  getMealSlotsSync(): MealSlotWithCode[] {
    return this.mealSlotsSubject.value;
  }

  private fetchAndCache(): Observable<MealSlotWithCode[]> {
    this.isLoading = true;
    return this.http.get<ApiResponse<{ schedules: BackendSchedule[] }>>(
      `${this.baseUrl}${API_ENDPOINTS.SCHEDULE}`
    ).pipe(
      map(res => {
        const schedules = res.responseData?.data?.schedules || [];
        const slots = schedules.map(s => this.mapToMealSlot(s));
        this.mealSlotsSubject.next(slots);
        this.cacheTimestamp = Date.now();
        this.isLoading = false;
        return slots;
      }),
      catchError(err => {
        this.isLoading = false;
        return throwError(() => err);
      })
    );
  }

  createMealSlot(payload: { meal: string; code: string; active: boolean; schedule: any }): Observable<MealSlotWithCode> {
    return this.http.post<ApiResponse<{ schedule: BackendSchedule }>>(
      `${this.baseUrl}${API_ENDPOINTS.SCHEDULE}`, payload
    ).pipe(
      map(res => {
        const newSlot = this.mapToMealSlot(res.responseData.data.schedule);
        const current = this.mealSlotsSubject.value;
        this.mealSlotsSubject.next([...current, newSlot].sort((a, b) => compareMealStartTimes(a.startTime, b.startTime)));
        this.cacheTimestamp = Date.now();
        return newSlot;
      })
    );
  }

  updateMealSlot(id: string, payload: any): Observable<MealSlotWithCode> {
    return this.http.put<ApiResponse<{ schedule: BackendSchedule }>>(
      `${this.baseUrl}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`, payload
    ).pipe(
      map(res => {
        const updated = this.mapToMealSlot(res.responseData.data.schedule);
        const current = this.mealSlotsSubject.value.map(s => s.id === id ? updated : s);
        this.mealSlotsSubject.next(current.sort((a, b) => compareMealStartTimes(a.startTime, b.startTime)));
        this.cacheTimestamp = Date.now();
        return updated;
      })
    );
  }

  deleteMealSlot(id: string): Observable<void> {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_BY_ID(id)}`).pipe(
      map(() => {
        const current = this.mealSlotsSubject.value.filter(s => s.id !== id);
        this.mealSlotsSubject.next(current);
        this.cacheTimestamp = Date.now();
      })
    );
  }

  refresh(): Observable<MealSlotWithCode[]> {
    return this.fetchAndCache();
  }

  validateCodeUniqueness(code: string, excludeId?: string): boolean {
    const normalizedCode = code.toUpperCase();
    return !this.mealSlotsSubject.value.some(slot =>
      slot.code.toUpperCase() === normalizedCode && slot.id !== excludeId
    );
  }

  private getDayType(): 'weekday' | 'weekend' | 'holiday' {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return 'weekend';
    return 'weekday';
  }

  private mapToMealSlot(s: BackendSchedule): MealSlotWithCode {
    const dayType = this.getDayType();
    const schedule = s.schedule?.[dayType] || s.schedule?.weekday || { start: '00:00', end: '00:00' };
    const start24 = schedule.start;
    const end24 = schedule.end;
    const [sH, sM] = start24.split(':').map(Number);
    const startTime = sH * 60 + sM;

    const status = computeMealSlotStatus(start24, end24, s.active);

    return {
      id: s._id.$oid,
      name: s.meal.charAt(0).toUpperCase() + s.meal.slice(1).toLowerCase(),
      code: s.code || '',
      icon: s.icon || s.meal.toLowerCase(),
      timeRange: `${start24} - ${end24}`,
      status,
      start24,
      end24,
      startTime,
      active: s.active
    };
  }

  private toMins(time24: string): number {
    const [h, m] = time24.split(':').map(Number);
    return h * 60 + m;
  }
}