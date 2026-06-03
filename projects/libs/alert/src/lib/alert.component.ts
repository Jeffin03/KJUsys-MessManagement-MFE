import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AlertConfig } from './alert.models';

@Component({
  selector: 'lib-alert',
  template: `
    <div class="custom-alert-box alert-{{alert.type}}" [class.closing]="closing" [class.has-heading]="!!alert.heading">
      
      <!-- Icon section -->
      <div class="alert-icon-container">
        <svg *ngIf="alert.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon success-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <svg *ngIf="alert.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        <svg *ngIf="alert.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon warning-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <svg *ngIf="alert.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </div>

      <!-- Content section -->
      <div class="alert-content">
        <div class="alert-header" *ngIf="alert.heading">
           <h4 class="alert-heading">{{ alert.heading }}</h4>
        </div>
        <p class="alert-message">{{ alert.message }}</p>
        
        <div class="alert-actions" *ngIf="alert.actionButtonText">
          <button class="alert-btn btn-{{alert.type}}" (click)="onActionClick()">
             {{ alert.actionButtonText }}
          </button>
        </div>

      </div>

      <!-- Close Action -->
      <button class="close-btn" (click)="triggerClose()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

    </div>
  `,
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  @Input() alert!: AlertConfig;
  @Output() dismiss = new EventEmitter<string>();

  closing = false;

  onActionClick() {
    if (this.alert.actionCallback) {
      this.alert.actionCallback(this.alert.id!);
    }
    this.triggerClose();
  }

  triggerClose() {
    this.closing = true;
    setTimeout(() => {
      this.dismiss.emit(this.alert.id);
    }, 300); // Wait for the exit animation
  }
}
