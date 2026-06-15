import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStat } from '../../../../shared/models/dashboard.models';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-bar.component.html',
})
export class StatsBarComponent {
  @Input() stats: DashboardStat[] = [];
}