import { Component, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@libs/shared-ui';
import { HardwareDevice } from '../../../../shared/models/dashboard.models';

@Component({
  selector: 'app-hardware-status',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hardware-status.component.html',
})
export class HardwareStatusComponent implements OnChanges {
  @Input() hardware: HardwareDevice[] = [];
  @Input() uptimeSeconds = 0;
  @Input() responseTimeMs = 0;
  @Input() isRefreshing = false;
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() settingsRequested = new EventEmitter<void>();

  lastStatusUpdate: Date | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

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

  getLastSeenText(device: HardwareDevice): string {
    if (!device.lastSeenMs) return 'Never';
    const diffMs = Date.now() - device.lastSeenMs;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  }

  isStale(device: HardwareDevice): boolean {
    if (!device.lastSeenMs) return true;
    return (Date.now() - device.lastSeenMs) > 60000; // > 60s = stale
  }

  ngOnChanges(): void {
    if (this.hardware && this.hardware.length > 0) {
      this.lastStatusUpdate = new Date();
    }
    this.cdr.detectChanges();
  }

  refreshHardwareStatus(): void {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.refreshRequested.emit();
  }
}