import { Injectable } from '@angular/core';
import { AlertService } from '@libs/alert';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to handle browser network connectivity events and WiFi status updates.
 * This service encapsulates all network-related concerns to improve maintainability
 * by separating them from UI components like the dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();
  private wifiAlertShown = false;

  constructor(private alertService: AlertService) {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    this.isOnlineSubject.next(true);
    this.wifiAlertShown = false;
  }

  private handleOffline(): void {
    this.isOnlineSubject.next(false);
    if (!this.wifiAlertShown) {
      this.wifiAlertShown = true;
      this.alertService.warning(
        'Connection lost',
        'Check your Wi-Fi',
        'Check Wi-Fi',
        () => {
          // Optional action callback
        }
      );
    }
  }
}