import { Component } from '@angular/core';
import { AlertConfig } from './alert.models';

@Component({
  selector: 'lib-alert-container',
  template: `
    <div class="alert-container">
      <lib-alert
        *ngFor="let alert of alerts"
        [alert]="alert"
        (dismiss)="removeAlert(alert.id!)">
      </lib-alert>
    </div>
  `,
  styles: [`
    .alert-container {
      position: fixed;
      bottom: 70px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
      pointer-events: none; /* Let clicks pass through empty space */
    }
    
    lib-alert {
      pointer-events: auto; /* Re-enable clicks on the alert itself */
    }
  `]
})
export class AlertContainerComponent {
  alerts: AlertConfig[] = [];

  addAlert(alert: AlertConfig) {
    this.alerts.push(alert);
    // If there's an action button, do not auto-dismiss
    if (!alert.actionButtonText && alert.duration && alert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(alert.id!);
      }, alert.duration);
    }
  }

  removeAlert(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
  }
}
