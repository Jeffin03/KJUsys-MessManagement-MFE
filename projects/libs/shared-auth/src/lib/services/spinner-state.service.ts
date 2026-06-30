
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerStateService {
  private activeRequests = 0;
  private spinnerState = new BehaviorSubject<boolean>(false);
  spinnerState$ = this.spinnerState.asObservable();

  show(): void {
    this.activeRequests++;
    this.spinnerState.next(true);
  }

  hide(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      this.spinnerState.next(false);
    }
  }

  forceHide(): void {
    this.activeRequests = 0;
    this.spinnerState.next(false);
  }

  reset(): void {
    this.activeRequests = 0;
    this.spinnerState.next(false);
  }
}
