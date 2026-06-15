import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriber-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriber-stats.component.html',
})
export class SubscriberStatsComponent {
  @Input() stats = { total: 0, active: 0, paused: 0, lapsed: 0 };
}
