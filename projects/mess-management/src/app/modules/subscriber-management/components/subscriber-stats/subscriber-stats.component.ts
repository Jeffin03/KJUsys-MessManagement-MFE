import { Component, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriber-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriber-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriberStatsComponent {
  _stats = { total: 0, active: 0, paused: 0, lapsed: 0 };

  @Input() set stats(value: typeof this._stats) {
    this._stats = value;
    this.cdr.markForCheck();
  }
  get stats(): typeof this._stats {
    return this._stats;
  }

  constructor(private cdr: ChangeDetectorRef) {}
}
