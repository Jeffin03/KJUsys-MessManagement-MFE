import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MealSlot, MealEntry } from '../../../shared/models/dashboard.models';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';

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
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  getSchedules(): Observable<MealSlot[]> {
    return this.http.get<MealSlot[]>(`${this.baseUrl}${API_ENDPOINTS.SCHEDULE_TODAY}`);
  }

  getTaps(): Observable<MealEntry[]> {
    return this.http.get<MealEntry[]>(`${this.baseUrl}${API_ENDPOINTS.TAPS}`);
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