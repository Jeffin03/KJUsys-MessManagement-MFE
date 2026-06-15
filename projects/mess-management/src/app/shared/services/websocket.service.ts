import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private wsUrl: string;

  private tapNewSubject = new Subject<any>();
  private tapDuplicateSubject = new Subject<any>();

  public tapNew$ = this.tapNewSubject.asObservable();
  public tapDuplicate$ = this.tapDuplicateSubject.asObservable();

  constructor(private ngZone: NgZone) {
    // Derive protocol: wss for https, ws for http
    const isHttps = environment.baseUrl.startsWith('https');
    const wsProtocol = isHttps ? 'wss' : 'ws';
    // Remove protocol from baseUrl (e.g., https://host.com/kjusys-api -> host.com/kjusys-api)
    const urlWithoutProtocol = environment.baseUrl.replace(/^https?:\/\//, '');
    this.wsUrl = `${wsProtocol}://${urlWithoutProtocol}/ws`;
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected to', this.wsUrl);
    };

    this.socket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'tap.new') {
            this.tapNewSubject.next(parsed.data);
          } else if (parsed.event === 'tap.duplicate') {
            this.tapDuplicateSubject.next(parsed.data);
          } else if (parsed.event === 'connected') {
            console.log(parsed.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      });
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event);
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
