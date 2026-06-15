import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HardwareDevice } from '../../../../shared/models/dashboard.models';

@Component({
  selector: 'app-hardware-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hardware-status.component.html',
})
export class HardwareStatusComponent implements OnChanges {
  @Input() hardware: HardwareDevice[] = [];
  @Input() uptimeSeconds = 0;

  get formattedUptime(): string {
    const h = Math.floor(this.uptimeSeconds / 3600);
    const m = Math.floor((this.uptimeSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  get uptimePercent(): number {
    return Math.min((this.uptimeSeconds / (24 * 3600)) * 100, 100);
  }

  getDotColor(status: HardwareDevice['status']): string {
    switch (status) {
      case 'Online': return '#1D9F00';
      case 'Connected': return '#1D9F00';
      case 'Low Paper': return '#FE9A00';
      case 'Offline': return '#D92C2B';
      default: return '#86868B';
    }
  }
  ngOnChanges(): void { }
}