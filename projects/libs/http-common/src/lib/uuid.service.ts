import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class UuidService {
  private uuid$: BehaviorSubject<string>;

  constructor() {
    this.uuid$ = new BehaviorSubject<string>(uuidv4());
  }

  getUuid(): string {
    return this.uuid$.value;
  }

  updateUuid(): void {
    this.uuid$.next(uuidv4());
  }
}
