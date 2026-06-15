import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, ApiResponse, BackendSchedule } from '../../services/dashboard.service';

interface MealSlotConfig {
  id?: string;
  name: string;
  icon: string;
  timeRange: string;
  status: 'Closed' | 'Live' | 'Upcoming';
  start24: string;
  end24: string;
}

@Component({
  selector: 'app-configure-meal-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configure-meal-slots.component.html',
})
export class ConfigureMealSlotsComponent implements OnChanges, OnDestroy {

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  showConflictPopup = false;
  conflictMessage = '';
  conflictSlotIndex: number | null = null; // Index of conflicting slot to highlight

  showDeleteConfirmPopup = false;
  pendingDeleteIndex: number | null = null;

  // Form validation flags
  nameInvalid = false;
  iconInvalid = false;
  startTimeInvalid = false;
  endTimeInvalid = false;
  timeInvalid = false; // For end time before start time

  // Edit flow
  editIndex: number | null = null;
  isEditing = false;

  constructor(
    private elementRef: ElementRef,
    private dashboardService: DashboardService
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.close();
    }
  }

  closeAllDropdowns() {
    this.showIconDropdown = false;
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showStatusDropdown = false;
  }

  slots: MealSlotConfig[] = [];

  newSlot = {
    name: '',
    icon: '',
    status: '',
    startHour: null as any,
    startMin: null as any,
    endHour: null as any,
    endMin: null as any,
  };

  startTimeSet = false;
  endTimeSet = false;

  iconOptions = ['default', 'breakfast', 'lunch', 'snacks', 'dinner'];
  statusOptions = ['Closed', 'Live', 'Upcoming'];

  showStartPicker = false;
  showEndPicker = false;
  showIconDropdown = false;
  showStatusDropdown = false;

  close() { this.closed.emit(); }

  private computeStatus(start24: string, end24: string): 'Closed' | 'Live' | 'Upcoming' {
    if (!start24 || !end24) return 'Upcoming';
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = start24.split(':').map(Number);
    const [eH, eM] = end24.split(':').map(Number);
    const start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (end < start) end += 24 * 60;
    if (cur > end) return 'Closed';
    if (cur >= start && cur <= end) return 'Live';
    return 'Upcoming';
  }

  private to24(hour: number, min: number): string {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  private toMins(time24: string): number {
    const [h, m] = time24.split(':').map(Number);
    return h * 60 + m;
  }

  private overlaps(newStart: string, newEnd: string, excludeIndex?: number): MealSlotConfig | null {
    const ns = this.toMins(newStart);
    const ne = this.toMins(newEnd);
    for (let i = 0; i < this.slots.length; i++) {
      if (excludeIndex !== undefined && i === excludeIndex) continue;
      const slot = this.slots[i];
      const es = this.toMins(slot.start24);
      const ee = this.toMins(slot.end24);
      if (ns < ee && ne > es) return slot;
    }
    return null;
  }

  // Validation
  validateForm(): boolean {
    let valid = true;
    this.nameInvalid = !this.newSlot.name || this.newSlot.name.trim() === '';
    this.iconInvalid = !this.newSlot.icon;
    this.startTimeInvalid = !this.startTimeSet;
    this.endTimeInvalid = !this.endTimeSet;

    // Time validation: end time must be after start time
    if (this.startTimeSet && this.endTimeSet) {
      const startTime = this.to24(this.newSlot.startHour, this.newSlot.startMin);
      const endTime = this.to24(this.newSlot.endHour, this.newSlot.endMin);
      this.timeInvalid = this.toMins(endTime) <= this.toMins(startTime);
      if (this.timeInvalid) {
        valid = false;
      }
    } else {
      this.timeInvalid = false;
    }

    if (this.nameInvalid || this.iconInvalid || this.startTimeInvalid || this.endTimeInvalid || this.timeInvalid) {
      valid = false;
    }
    return valid;
  }

  toggleIconDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showIconDropdown;
    this.closeAllDropdowns();
    this.showIconDropdown = !wasOpen;
  }

  toggleStatusDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showStatusDropdown;
    this.closeAllDropdowns();
    this.showStatusDropdown = !wasOpen;
  }

  toggleStartPicker(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showStartPicker;
    this.closeAllDropdowns();
    this.showStartPicker = !wasOpen;
    if (!this.startTimeSet) {
      this.newSlot.startHour = 7;
      this.newSlot.startMin = 0;
      this.startTimeSet = true;
    }
  }

  toggleEndPicker(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showEndPicker;
    this.closeAllDropdowns();
    this.showEndPicker = !wasOpen;
    if (!this.endTimeSet) {
      this.newSlot.endHour = 9;
      this.newSlot.endMin = 0;
      this.endTimeSet = true;
    }
  }

  stopProp(event: MouseEvent) { event.stopPropagation(); }

  formatTime(hour: number, min: number): string {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  incrementHour(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startHour = this.newSlot.startHour >= 23 ? 0 : this.newSlot.startHour + 1;
    else this.newSlot.endHour = this.newSlot.endHour >= 23 ? 0 : this.newSlot.endHour + 1;
  }
  decrementHour(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startHour = this.newSlot.startHour <= 0 ? 23 : this.newSlot.startHour - 1;
    else this.newSlot.endHour = this.newSlot.endHour <= 0 ? 23 : this.newSlot.endHour - 1;
  }
  incrementMin(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startMin = this.newSlot.startMin >= 59 ? 0 : this.newSlot.startMin + 1;
    else this.newSlot.endMin = this.newSlot.endMin >= 59 ? 0 : this.newSlot.endMin + 1;
  }
  decrementMin(type: 'start' | 'end') {
    if (type === 'start') this.newSlot.startMin = this.newSlot.startMin <= 0 ? 59 : this.newSlot.startMin - 1;
    else this.newSlot.endMin = this.newSlot.endMin <= 0 ? 59 : this.newSlot.endMin - 1;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Closed': return 'bg-[#FEE2E2] text-[#D92C2B]';
      case 'Live': return 'bg-[#DCFCE7] text-[#1D9F00]';
      case 'Upcoming': return 'bg-[rgba(254,154,0,0.2)] text-[#BB4D00]';
      default: return '';
    }
  }

  dismissConflict() {
    this.showConflictPopup = false;
    this.conflictMessage = '';
    this.conflictSlotIndex = null;
  }

  viewConflict() {
    if (this.conflictSlotIndex !== null) {
      // Scroll the conflicting slot into view
      setTimeout(() => {
        const element = document.querySelector(`div[data-slot-index="${this.conflictSlotIndex}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the slot briefly
          element.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500');
          }, 2000);
        }
      }, 100);
    }
    this.dismissConflict();
  }

  requestDeleteSlot(index: number) {
    this.pendingDeleteIndex = index;
    this.showDeleteConfirmPopup = true;
  }

  confirmDeleteSlot() {
    if (this.pendingDeleteIndex === null) return;
    const index = this.pendingDeleteIndex;
    const slot = this.slots[index];
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteIndex = null;
    if (slot.id) {
      this.dashboardService.deleteSchedule(slot.id).subscribe(() => {
        this.slots.splice(index, 1);
      });
    } else {
      this.slots.splice(index, 1);
    }
  }

  cancelDeleteSlot() {
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteIndex = null;
  }

  // Add or Update slot
  addSlot() {
    if (!this.validateForm()) {
      return;
    }

    const s24 = this.to24(this.newSlot.startHour, this.newSlot.startMin);
    const e24 = this.to24(this.newSlot.endHour, this.newSlot.endMin);

    if (this.toMins(e24) <= this.toMins(s24)) {
      this.conflictMessage = 'End time must be after start time.';
      this.showConflictPopup = true;
      return;
    }

    const excludeIndex = this.isEditing && this.editIndex !== null ? this.editIndex : undefined;
    const conflict = this.overlaps(s24, e24, excludeIndex);
    if (conflict) {
      // Find the index of the conflicting slot
      const conflictIndex = this.slots.findIndex(slot => slot.name === conflict.name && slot.timeRange === conflict.timeRange);
      this.conflictSlotIndex = conflictIndex !== -1 ? conflictIndex : null;
      this.conflictMessage = `Time conflict with "${conflict.name}" (${conflict.timeRange}). Two meal slots cannot overlap. Please choose a different time window.`;
      this.showConflictPopup = true;
      return;
    }

    const payload = {
      meal: this.newSlot.name.toUpperCase(),
      active: true,
      schedule: {
        weekday: { start: s24, end: e24 },
        weekend: { start: s24, end: e24 },
        holiday: { start: s24, end: e24 }
      }
    };

    const currentIndex = this.editIndex;
    if (this.isEditing && currentIndex !== null && this.slots[currentIndex].id) {
      const slotId = this.slots[currentIndex].id!;
      // Update existing slot
      this.dashboardService.updateSchedule(slotId, payload).subscribe({
        next: (res: ApiResponse<{ schedule: BackendSchedule }>) => {
          const status = this.computeStatus(s24, e24);
          this.slots[currentIndex] = {
            id: slotId,
            name: this.newSlot.name,
            icon: this.newSlot.icon,
            timeRange: `${this.formatTime(this.newSlot.startHour, this.newSlot.startMin)} - ${this.formatTime(this.newSlot.endHour, this.newSlot.endMin)}`,
            status,
            start24: s24,
            end24: e24
          };
          this.resetForm();
          this.isEditing = false;
          this.editIndex = null;
        },
        error: (err: any) => {
          console.error('Update failed', err);
          alert('Failed to update slot. Please try again.');
        }
      });
    } else {
      // Create new slot
      this.dashboardService.createSchedule(payload).subscribe({
        next: (res: ApiResponse<{ schedule: BackendSchedule }>) => {
          const status = this.computeStatus(s24, e24);
          this.slots.push({
            id: (res.responseData?.data?.schedule as any)?._id?.$oid || (res.responseData?.data as any)?._id?.$oid || undefined,
            name: this.newSlot.name,
            icon: this.newSlot.icon,
            timeRange: `${this.formatTime(this.newSlot.startHour, this.newSlot.startMin)} - ${this.formatTime(this.newSlot.endHour, this.newSlot.endMin)}`,
            status,
            start24: s24,
            end24: e24
          });
          this.resetForm();
        }
      });
    }

    // Re-sort after add/update
    this.slots.sort((a, b) => this.toMins(a.start24) - this.toMins(b.start24));
    this.closeAllDropdowns();
  }

  private resetForm() {
    this.newSlot = {
      name: '',
      icon: '',
      status: '',
      startHour: null as any,
      startMin: null as any,
      endHour: null as any,
      endMin: null as any,
    };
    this.startTimeSet = false;
    this.endTimeSet = false;
    this.nameInvalid = false;
    this.iconInvalid = false;
    this.startTimeInvalid = false;
    this.endTimeInvalid = false;
    this.timeInvalid = false;
  }

  editSlot(index: number) {
    this.isEditing = true;
    this.editIndex = index;
    const slot = this.slots[index];
    this.newSlot.name = slot.name;
    this.newSlot.icon = slot.icon;
    this.newSlot.status = slot.status;
    // Parse timeRange back to hour/min
    const start24 = slot.start24;
    const end24 = slot.end24;
    const [startH, startM] = start24.split(':').map(Number);
    const [endH, endM] = end24.split(':').map(Number);
    this.newSlot.startHour = startH;
    this.newSlot.startMin = startM;
    this.newSlot.endHour = endH;
    this.newSlot.endMin = endM;
    this.startTimeSet = true;
    this.endTimeSet = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editIndex = null;
    this.resetForm();
    this.closeAllDropdowns();
  }

  saveConfiguration() {
    this.close();
    // Optionally emit event instead of reload
    // this.configurationSaved.emit();
    window.location.reload();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      document.body.style.overflow = 'hidden';
      this.dashboardService.getRawSchedules().subscribe({
        next: (res: ApiResponse<{ schedules: BackendSchedule[] }>) => {
          const rawSchedules = res.responseData?.data?.schedules || [];
          this.slots = rawSchedules.map((s: any) => {
            const start24 = s.schedule?.weekday?.start || '00:00';
            const end24 = s.schedule?.weekday?.end || '00:00';
            return {
              id: s._id.$oid,
              name: s.meal.charAt(0).toUpperCase() + s.meal.slice(1).toLowerCase(),
              icon: s.meal.toLowerCase(),
              timeRange: `${start24} - ${end24}`,
              status: this.computeStatus(start24, end24),
              start24,
              end24
            } as MealSlotConfig;
          }).sort((a: MealSlotConfig, b: MealSlotConfig) => this.toMins(a.start24) - this.toMins(b.start24));
        }
      });
    } else {
      document.body.style.overflow = '';
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}