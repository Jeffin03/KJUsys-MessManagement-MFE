import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealEntry } from '../../../../shared/models/dashboard.models';
import { EmptyStateComponent } from '@libs/shared-ui';

@Component({
  selector: 'app-entries-table',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './entries-table.component.html',
})
export class EntriesTableComponent implements OnChanges {
  @Input() entries: MealEntry[] = [];
  @Output() onEntryClick = new EventEmitter<MealEntry>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.cdr.detectChanges();
    }
  }

  getStatusClass(status: MealEntry['status']): string {
    return status === 'Allowed'
      ? 'bg-[#F0FDF4] text-[#007A55] rounded-lg'
      : 'bg-[#FFF1F2] text-[#C70036] rounded-lg';
  }
}