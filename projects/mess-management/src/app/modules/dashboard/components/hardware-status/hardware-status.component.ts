import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
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
  @Input() isRefreshing = false;
  @Output() refreshRequested = new EventEmitter<void>();

  lastStatusUpdate: Date | null = null;

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

  ngOnChanges(): void {
    // Update last status update time when new hardware data arrives
    if (this.hardware && this.hardware.length > 0) {
      this.lastStatusUpdate = new Date();
    }
  }

  refreshHardwareStatus(): void {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.refreshRequested.emit();
  }
}