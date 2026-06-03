import { ApplicationRef, createComponent, EnvironmentInjector, Injectable, ComponentRef } from '@angular/core';
import { AlertConfig } from './alert.models';
import { AlertContainerComponent } from './alert-container.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private containerRef: ComponentRef<AlertContainerComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  private ensureContainer() {
    if (!this.containerRef) {
      this.containerRef = createComponent(AlertContainerComponent, {
        environmentInjector: this.injector,
      });
      this.appRef.attachView(this.containerRef.hostView);
      document.body.appendChild(this.containerRef.location.nativeElement);
    }
  }

  show(config: AlertConfig) {
    this.ensureContainer();
    const id = config.id || Math.random().toString(36).substring(2, 9);
    this.containerRef?.instance.addAlert({ ...config, id });
  }

  /**
   * Shows a success alert.
   * @param message The message to display.
   * @param heading Optional bold title.
   * @param actionButtonText Optional text for an action button (removes auto-dismiss if provided).
   * @param actionCallback Optional callback triggered when action button is clicked.
   */
  success(message: string, heading?: string, actionButtonText?: string, actionCallback?: (id: string) => void) {
    this.show({ type: 'success', message, heading, actionButtonText, actionCallback, duration: 5000 });
  }

  /**
   * Shows an error alert.
   * @param message The message to display.
   * @param heading Optional bold title.
   * @param actionButtonText Optional text for an action button (removes auto-dismiss if provided).
   * @param actionCallback Optional callback triggered when action button is clicked.
   */
  error(message: string, heading?: string, actionButtonText?: string, actionCallback?: (id: string) => void) {
    this.show({ type: 'error', message, heading, actionButtonText, actionCallback, duration: 5000 });
  }

  /**
   * Shows a warning alert.
   * @param message The message to display.
   * @param heading Optional bold title.
   * @param actionButtonText Optional text for an action button (removes auto-dismiss if provided).
   * @param actionCallback Optional callback triggered when action button is clicked.
   */
  warning(message: string, heading?: string, actionButtonText?: string, actionCallback?: (id: string) => void) {
    this.show({ type: 'warning', message, heading, actionButtonText, actionCallback, duration: 5000 });
  }

  /**
   * Shows an information alert.
   * @param message The message to display.
   * @param heading Optional bold title.
   * @param actionButtonText Optional text for an action button (removes auto-dismiss if provided).
   * @param actionCallback Optional callback triggered when action button is clicked.
   */
  info(message: string, heading?: string, actionButtonText?: string, actionCallback?: (id: string) => void) {
    this.show({ type: 'info', message, heading, actionButtonText, actionCallback, duration: 5000 });
  }
}
