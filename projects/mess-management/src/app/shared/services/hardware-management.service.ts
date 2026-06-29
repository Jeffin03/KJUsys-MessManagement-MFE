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
  state: 'pending' | 'active' | 'revoked';
  lastSeen: number;
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
    return this.http.get<ApiResponse<{ devices: HardwareDevice[] }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE}`)
      .pipe(
        map(res => res.responseData?.data?.devices || [])
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

  startPairing(): Observable<{ windowExpiresAt: number }> {
    return this.http.post<ApiResponse<{ windowExpiresAt: number }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_START_PAIRING}`, {})
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

  confirmDevice(deviceId: string): Observable<HardwareDevice> {
    return this.http.post<ApiResponse<HardwareDevice>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_CONFIRM(deviceId)}`, {})
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  cancelPairing(): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_START_PAIRING}`, {}).pipe(
      map(() => {})
    );
  }

  sendTestCommand(deviceId: string, testType: string): Observable<any> {
    const endpoint = testType === 'lcd' || testType === 'display'
      ? API_ENDPOINTS.HARDWARE_TEST_DISPLAY(deviceId)
      : API_ENDPOINTS.HARDWARE_TEST_PRINTER(deviceId);
    return this.http.post(`${this.baseUrl}${endpoint}`, {});
  }

  sendTestDisplay(deviceId: string, lcdLine1: string, lcdLine2: string): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_TEST_DISPLAY(deviceId)}`, { lcd_line1: lcdLine1, lcd_line2: lcdLine2 });
  }

  rotateSecret(deviceId: string): Observable<{ newSecret: string }> {
    return this.http.post<ApiResponse<{ newSecret: string }>>(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_ROTATE_SECRET(deviceId)}`, {})
      .pipe(
        map(res => res.responseData?.data)
      );
  }

  stopDevice(deviceId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.HARDWARE_STOP(deviceId)}`, {});
  }
}
