import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealSlot } from '../../../../shared/models/dashboard.models';
import { ConfigureMealSlotsComponent } from '../configure-meal-slots/configure-meal-slots.component';

@Component({
  selector: 'app-meal-slots',
  standalone: true,
  imports: [CommonModule, ConfigureMealSlotsComponent],
  templateUrl: './meal-slots.component.html',
  styleUrls: ['./meal-slots.component.css'],
})
export class MealSlotsComponent {
  @Input() mealSlots: MealSlot[] = [];
  isConfigureOpen = false;
  hovering = false;

  openConfigure() { this.isConfigureOpen = true; }
  closeConfigure() { this.isConfigureOpen = false; }

  getStatusClass(status: MealSlot['status']): string {
    switch (status) {
      case 'Closed': return 'bg-[rgba(193,0,7,0.2)] text-[#C10007] rounded-[28px]';
      case 'Live': return 'bg-[#DCFCE7] text-[#1D9F00] border border-[#BBF7D0]';
      case 'Upcoming': return 'bg-[#FEF3C7] text-[#BB4D00] border border-[#FDE68A]';
      default: return '';
    }
  }
}