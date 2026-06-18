import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { AlertService } from '@libs/alert';

@Injectable({
  providedIn: 'root'
})
export class ConnectionMonitorService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  isOnline$ = this.isOnlineSubject.asObservable();

  private isServerDownSubject = new BehaviorSubject<boolean>(false);
  isServerDown$ = this.isServerDownSubject.asObservable();

  private connectionRestoredSubject = new Subject<void>();
  connectionRestored$ = this.connectionRestoredSubject.asObservable();

  private serverDownAlertShown = false;

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {
    window.addEventListener('online', () => this.isOnlineSubject.next(true));
    window.addEventListener('offline', () => this.isOnlineSubject.next(false));

    // Subscribe to server down status to show alert when server goes down
    let wasDown = false;
    this.isServerDown$.subscribe(isDown => {
      if (isDown) {
        wasDown = true;
        if (!this.serverDownAlertShown) {
          this.showServerDownAlert(false);
        }
      } else {
        // Reset flag when server is back up
        this.serverDownAlertShown = false;
        if (wasDown) {
          wasDown = false;
          this.connectionRestoredSubject.next();
        }
      }
    });
  }

  private showServerDownAlert(isRetryFailure = false): void {
    this.serverDownAlertShown = true;
    this.alertService.error(
      isRetryFailure
        ? 'Connection is still not available. Please check your network or try again.'
        : 'Connection failed to reach the server',
      isRetryFailure ? 'Server Still Unreachable' : 'Server Unreachable',
      'Retry',
      () => {
        this.pingServer().subscribe(isConnected => {
          if (isConnected) {
            this.alertService.success('Server connection restored', 'Server Reachable');
          } else {
            this.serverDownAlertShown = false;
            // Delay slightly to let the close animation of the previous alert finish
            setTimeout(() => {
              this.showServerDownAlert(true);
            }, 350);
          }
        });
      }
    );
  }

  setServerDown(status: boolean): void {
    this.isServerDownSubject.next(status);
  }

  /** Get base URL from environment */
  private get baseUrl(): string {
    return environment.baseUrl;
  }

  pingServer(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/health`, { observe: 'response' }).pipe(
      map(response => {
        if (response.status === 200) {
          this.setServerDown(false);
          return true;
        }
        return false;
      }),
      catchError(() => {
        // Fallback check against the context path health just in case
        return this.http.get(`${this.baseUrl}${API_ENDPOINTS.HEALTH}`, { observe: 'response' }).pipe(
          map(res => {
            if (res.status === 200) {
              this.setServerDown(false);
              return true;
            }
            return false;
          }),
          catchError(() => of(false))
        );
      })
    );
  }
}