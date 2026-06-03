import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'custom';

export interface ToastMessage {
  id: number;
  title?: string;
  message: string;
  type: ToastType;
  iconSvg?: string;
  iconBgColor?: string;
  textColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedToastService {

  private get toastSubject(): Subject<ToastMessage> {
    const win = window as any;
    if (!win.__sharedToastSubject) {
      win.__sharedToastSubject = new Subject<ToastMessage>();
    }
    return win.__sharedToastSubject;
  }

  toast$ = this.toastSubject.asObservable();

  private generateId(): number {
    return Date.now() + Math.random();
  }

  showToast(toast: Omit<ToastMessage, 'id'>) {
    const fullToast: ToastMessage = {
      ...toast,
      id: this.generateId()
    };

    this.toastSubject.next(fullToast);
  }

  success(message: string, title?: string) {
    this.showToast({ message, title, type: 'success' });
  }

  error(message: string, title?: string) {
    this.showToast({ message, title, type: 'error' });
  }

  warning(message: string, title?: string) {
    this.showToast({ message, title, type: 'warning' });
  }

  info(message: string, title?: string) {
    this.showToast({ message, title, type: 'info' });
  }

  custom(toast: Omit<ToastMessage, 'id' | 'type'>) {
    this.showToast({ ...toast, type: 'custom' });
  }
}