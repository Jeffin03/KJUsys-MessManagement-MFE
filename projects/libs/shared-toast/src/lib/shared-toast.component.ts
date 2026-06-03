import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { SharedToastService, ToastMessage } from './shared-toast.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'shared-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-toast.html',
  styleUrls: ['./shared-toast.css'],
  animations: [
    trigger('toastTrigger', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class SharedToastComponent implements OnInit, OnDestroy {

  toasts: ToastMessage[] = [];

  private timeoutIds = new Map<number, any>();
  private remainingTime = new Map<number, number>();
  private startTime = new Map<number, number>();
  private duration = 5000; // 5 seconds

  private sub: any;

  constructor(
    private toastService: SharedToastService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe((toast) => {
      this.ngZone.run(() => {
        this.toasts.push(toast);

        // initialize timer tracking
        this.remainingTime.set(toast.id, this.duration);
        this.startTimeout(toast.id, this.duration);
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ✅ START TIMER
  startTimeout(id: number, time: number) {
    this.startTime.set(id, Date.now());

    const timeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.removeToastById(id);
      });
    }, time);

    this.timeoutIds.set(id, timeout);
  }

  // ✅ PAUSE ON HOVER
  pauseToast(id: number) {
    const timeout = this.timeoutIds.get(id);

    if (timeout) {
      clearTimeout(timeout);
      this.timeoutIds.delete(id);

      const startedAt = this.startTime.get(id) || 0;
      const elapsed = Date.now() - startedAt;
      const remaining = (this.remainingTime.get(id) || this.duration) - elapsed;

      this.remainingTime.set(id, remaining > 0 ? remaining : 0);
    }
  }

  // ✅ RESUME WITH REMAINING TIME
  resumeToast(id: number) {
    if (!this.timeoutIds.has(id)) {
      const remaining = this.remainingTime.get(id) || this.duration;

      if (remaining > 0) {
        this.startTimeout(id, remaining);
      } else {
        this.removeToastById(id);
      }
    }
  }

  // ✅ REMOVE (CLICK OR AUTO)
  removeToastById(id: number) {
    this.pauseToast(id);

    this.toasts = this.toasts.filter(t => t.id !== id);

    // cleanup
    this.timeoutIds.delete(id);
    this.remainingTime.delete(id);
    this.startTime.delete(id);
    
    this.cdr.detectChanges();
  }

  // ✅ styles
  getStyles(toast: ToastMessage) {
    if (toast.type === 'custom') {
      return {
        bg: '#ffffff',
        iconBg: toast.iconBgColor || '#f3f4f6',
        color: toast.textColor || '#1f2937',
        border: '#e5e7eb',
        icon: this.sanitizeSvg(toast.iconSvg)
      };
    }

    const map: any = {
      success: {
        bg: '#ffffff',
        iconBg: '#f0fdf4',
        color: '#000000',
        border: '#e5e7eb',
        icon: this.sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="none" stroke="#166534" stroke-width="3" d="M20 6L9 17l-5-5"/>
                    </svg>`)
      },
      error: {
        bg: '#ffffff',
        iconBg: '#fef2f2',
        color: '#000000',
        border: '#e5e7eb',
        icon: this.sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#991b1b" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>`)
      },
      warning: {
        bg: '#ffffff',
        iconBg: '#fffbeb',
        color: '#000000',
        border: '#e5e7eb',
        icon: this.sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#92400e" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>`)
      },
      info: {
        bg: '#ffffff',
        iconBg: '#eff6ff',
        color: '#000000',
        border: '#e5e7eb',
        icon: this.sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#1d4ed8" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>`)
      }
    };

    return map[toast.type || 'success'];
  }

  sanitizeSvg(svg: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg || '');
  }
}