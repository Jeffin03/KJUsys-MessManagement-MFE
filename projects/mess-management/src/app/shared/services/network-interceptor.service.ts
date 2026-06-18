import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConnectionMonitorService } from './connection-monitor.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {

  constructor(
    private connectionMonitor: ConnectionMonitorService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check for network errors (status 0 or 502-504)
        if (error.status === 0 || (error.status >= 502 && error.status <= 504)) {
          // Skip health check endpoints to avoid spamming alerts
          if (!req.url.includes('health')) {
            // Set server down status in connection monitor
            this.connectionMonitor.setServerDown(true);
          }
        }
        return throwError(() => error);
      })
    );
  }
}