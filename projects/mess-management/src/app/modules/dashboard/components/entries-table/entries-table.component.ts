import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealEntry } from '../../../../shared/models/dashboard.models';
@Component({
  selector: 'app-entries-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entries-table.component.html',
})
export class EntriesTableComponent {
  @Input() entries: MealEntry[] = [];

  getStatusClass(status: MealEntry['status']): string {
    return status === 'Allowed'
      ? 'bg-[#F0FDF4] text-[#007A55] rounded-lg'
      : 'bg-[#FFF1F2] text-[#C70036] rounded-lg';
  }
}