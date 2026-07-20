import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { environment } from '../../../environments/environment';

export interface HardwarePeripheral {
  type: 'lcd' | 'printer' | 'buzzer' | 'relay';
  status: 'online' | 'offline' | 'error';
}

export interface HardwareDevice {
  _id: string;
  name: string;
  type: string;
  state: 'pending' | 'active' | 'revoked' | 'disconnected';
  lastSeenMs: number;
  macAddress?: string;
  peripherals: HardwarePeripheral[];
  hmacSecret?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  type: string;
  responseData: {
    data: T;
    message: any[];
  };
}

@Injectable({ providedIn: 'root' })
export class HardwareManagementService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getDevices(): Observable<HardwareDevice[]> {
    return this.http.get<ApiResponse<{ hardware: HardwareDevice[] }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE}`)
      .pipe(
        map(res => res.responseData?.data?.hardware || [])
      );
  }

  getDevice(deviceId: string): Observable<HardwareDevice> {
    return this.http.get<ApiResponse<HardwareDevice>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_BY_ID(deviceId)}`)
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  deleteDevice(deviceId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_BY_ID(deviceId)}`);
  }

  startPairing(): Observable<{ code: string; expiresInMs: number }> {
    return this.http.post<ApiResponse<{ code: string; expiresInMs: number }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_START_PAIRING}`, {})
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  pairDevice(macAddress: string, code: string): Observable<HardwareDevice> {
    return this.http.post<ApiResponse<HardwareDevice>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_PAIR}`, { macAddress, code })
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  confirmDevice(deviceId: string): Observable<{ status: string; hmacSecret: string; hmacSecretHash: string }> {
    return this.http.post<ApiResponse<{ status: string; hmacSecret: string; hmacSecretHash: string }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_CONFIRM(deviceId)}`, {})
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  cancelPairing(): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_START_PAIRING}`, {}).pipe(
      map(() => {})
    );
  }

  rotateSecret(deviceId: string): Observable<{ newSecret: string; newSecretHash: string }> {
    return this.http.post<ApiResponse<{ newSecret: string; newSecretHash: string }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_ROTATE_SECRET(deviceId)}`, {})
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  updateDevice(deviceId: string, data: Partial<{ name: string; type: string }>): Observable<any> {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_BY_ID(deviceId)}`, data);
  }

  connectDevice(macAddress: string, name: string, type: string): Observable<{ device: HardwareDevice; hmacSecret: string; hmacSecretHash: string }> {
    return this.http.post<ApiResponse<{ device: HardwareDevice; hmacSecret: string; hmacSecretHash: string }>>(
      `${this.baseUrl}${API_ENDPOINTS.HARDWARE_CONNECT}`, { macAddress, name, type }
    ).pipe(
      map(res => res.responseData?.data)
    );
  }
}
