import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealSlot } from '../../../../shared/models/dashboard.models';
import { ConfigureMealSlotsComponent } from '../configure-meal-slots/configure-meal-slots.component';
import { ButtonComponent } from '@libs/shared-ui';

@Component({
  selector: 'app-meal-slots',
  standalone: true,
  imports: [CommonModule, ConfigureMealSlotsComponent, ButtonComponent],
  templateUrl: './meal-slots.component.html',
  styleUrls: ['./meal-slots.component.css'],
})
export class MealSlotsComponent implements OnChanges {
  @Input() mealSlots: MealSlot[] = [];
  @Input() isHoliday = false;
  @Output() configurationSaved = new EventEmitter<void>();
  isConfigureOpen = false;
  hovering = false;
  private prevHadMeal = new Map<string, number>();

  constructor(private cdr: ChangeDetectorRef) {}

  openConfigure() { this.isConfigureOpen = true; this.cdr.detectChanges(); }
  closeConfigure() { this.isConfigureOpen = false; this.cdr.detectChanges(); }

  getStatusClass(status: MealSlot['status']): string {
    switch (status) {
      case 'Closed': return 'bg-[rgba(193,0,7,0.2)] text-[#C10007] rounded-[28px]';
      case 'Live': return 'bg-[#DCFCE7] text-[#1D9F00] border border-[#BBF7D0]';
      case 'Upcoming': return 'bg-[#FEF3C7] text-[#BB4D00] border border-[#FDE68A]';
      case 'Inactive': return 'bg-[#ECD6FF] text-[#9922FE] border border-[#D8B4FE]';
      default: return '';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mealSlots'] && this.mealSlots) {
      this.mealSlots.forEach(slot => {
        const prev = this.prevHadMeal.get(slot.name) ?? 0;
        const curr = slot.hadMeal ?? 0;
        if (curr > prev) {
          this.triggerAnimation(slot.name);
        }
        this.prevHadMeal.set(slot.name, curr);
      });
      this.cdr.detectChanges();
    }
  }

  private triggerAnimation(slotName: string): void {
    const card = document.querySelector(`[data-meal-slot="${slotName}"]`);
    if (card) {
      card.classList.add('live-update-pulse');
      setTimeout(() => card.classList.remove('live-update-pulse'), 600);
    }
  }
}