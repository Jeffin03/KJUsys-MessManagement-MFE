import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private wsUrl: string;

  private tapNewSubject = new Subject<any>();
  private tapDuplicateSubject = new Subject<any>();
  private hardwareStatusSubject = new Subject<any>();
  private connectionStateSubject = new BehaviorSubject<'connecting' | 'open' | 'closed'>('closed');

  public tapNew$ = this.tapNewSubject.asObservable();
  public tapDuplicate$ = this.tapDuplicateSubject.asObservable();
  public hardwareStatus$ = this.hardwareStatusSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();

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
      console.log('[DEBUG] WebSocket already open/connecting, skipping');
      return;
    }

    console.log('[DEBUG] Connecting to WebSocket:', this.wsUrl);
    this.connectionStateSubject.next('connecting');
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log('[DEBUG] WebSocket connected to', this.wsUrl);
      this.connectionStateSubject.next('open');
      // Request current hardware status on connect/reconnect
      this.socket?.send(JSON.stringify({ event: 'get.hardware.status' }));
    };

    this.socket.onerror = (error) => {
      console.error('[DEBUG] WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('[DEBUG] WebSocket connection closed:', event.code, event.reason);
      this.connectionStateSubject.next('closed');
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const parsed = JSON.parse(event.data);
          console.log('[DEBUG] WebSocket message received:', parsed);
          if (parsed.event === 'tap.new') {
            console.log('[DEBUG] Emitting tap.new:', parsed.data);
            this.tapNewSubject.next(parsed.data);
          } else if (parsed.event === 'tap.duplicate') {
            console.log('[DEBUG] Emitting tap.duplicate:', parsed.data);
            this.tapDuplicateSubject.next(parsed.data);
          } else if (parsed.event === 'hardware.status') {
            this.hardwareStatusSubject.next(parsed.data);
          } else if (parsed.event === 'connected') {
            console.log(parsed.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      });
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStateSubject.next('closed');
  }
}
