import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubTabsModule, SubTabItem } from '@libs/sub-tabs';
import { ButtonComponent, EmptyStateComponent } from '@libs/shared-ui';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { SharedToastService } from '@libs/shared-toast';
import { HardwareManagementService, HardwareDevice, HardwarePeripheral } from '../../../../shared/services/hardware-management.service';

@Component({
  selector: 'app-hardware-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SubTabsModule, ButtonComponent, DropdownLibModule, EmptyStateComponent],
  templateUrl: './hardware-settings-modal.component.html',
})
export class HardwareSettingsModalComponent implements OnChanges, OnDestroy {
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) this.onClose();
  }

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(
    private hwMgmt: HardwareManagementService,
    private toast: SharedToastService,
    private cdr: ChangeDetectorRef
  ) {}

  subTabs: SubTabItem[] = [
    { id: 'devices', label: 'Devices', count: 0 },
    { id: 'pairing', label: 'Pairing' },
  ];
  activeTab = 'devices';

  devices: HardwareDevice[] = [];
  isLoading = false;

  pairingActive = false;
  pairingCountdown = 0;
  pairingTimer: any;
  pendingDevices: HardwareDevice[] = [];
  pendingPollingTimer: any;

  confirmName = '';
  confirmType = 'esp32';
  confirmMac = '';

  selectedDeviceType: any[] = [];
  testingPeripheralDeviceId = '';
  testingPeripheralType = '';

  rotatingDeviceId = '';
  confirmingDeviceId = '';
  editingDeviceId: string | null = null;
  editNameValue = '';

  showDeleteConfirmPopup = false;
  pendingDeleteDevice: HardwareDevice | null = null;

  readonly deviceTypes = [
    { id: 'esp32', title: 'ESP32 (LCD + Printer + Buzzer)' },
  ];

  ngOnChanges(): void {
    const appRoot = document.querySelector('app-root') as HTMLElement;
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (appRoot) {
        appRoot.style.height = '100vh';
        appRoot.style.overflow = 'hidden';
      }
      this.loadDevices();
    } else {
      this.unlockScroll();
      this.stopPairing();
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
    this.stopPairing();
  }

  private unlockScroll(): void {
    const appRoot = document.querySelector('app-root') as HTMLElement;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (appRoot) {
      appRoot.style.height = '';
      appRoot.style.overflow = '';
    }
  }

  onClose(): void {
    this.unlockScroll();
    this.close.emit();
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'devices') this.loadDevices();
    if (tabId === 'pairing') this.startPendingPolling();
    if (tabId !== 'pairing') this.stopPendingPolling();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.hwMgmt.getDevices().subscribe({
      next: (devices) => {
        this.devices = devices;
        this.subTabs = this.subTabs.map(t => t.id === 'devices' ? { ...t, count: devices.length } : t);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load devices');
      }
    });
  }

  isDeviceOnline(device: HardwareDevice): boolean {
    return device.state === 'active' && (Date.now() - device.lastSeenMs! < 60000);
  }

  getStatusLabel(device: HardwareDevice): string {
    switch (device.state) {
      case 'pending': return 'Pending';
      case 'active':
      case 'disconnected': return this.isDeviceOnline(device) ? 'Online' : 'Offline';
      case 'revoked': return 'Revoked';
      default: return 'Offline';
    }
  }

  getStatusColor(device: HardwareDevice): string {
    switch (device.state) {
      case 'pending': return '#FE9A00';
      case 'active':
      case 'disconnected': return this.isDeviceOnline(device) ? '#1D9F00' : '#D92C2B';
      case 'revoked': return '#86868B';
      default: return '#86868B';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'esp32': return 'chip';
      case 'printer': return 'printer';
      default: return 'wifi';
    }
  }

  requestDeleteDevice(device: HardwareDevice): void {
    this.pendingDeleteDevice = device;
    this.showDeleteConfirmPopup = true;
  }

  cancelDeleteDevice(): void {
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteDevice = null;
  }

  confirmDeleteDevice(): void {
    if (!this.pendingDeleteDevice) return;
    const deviceId = this.pendingDeleteDevice._id;
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteDevice = null;
    this.hwMgmt.deleteDevice(deviceId).subscribe({
      next: () => {
        this.toast.success('Device removed');
        this.loadDevices();
      },
      error: () => this.toast.error('Failed to remove device')
    });
  }

  startEdit(device: HardwareDevice): void {
    this.editingDeviceId = device._id;
    this.editNameValue = device.name;
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[name="device-name"]');
      input?.focus();
      input?.select();
    });
  }

  saveEdit(deviceId: string): void {
    if (!this.editingDeviceId) return;
    const name = this.editNameValue.trim();
    if (!name) {
      this.cancelEdit();
      return;
    }
    this.hwMgmt.updateDevice(deviceId, { name }).subscribe({
      next: () => {
        this.editingDeviceId = null;
        this.loadDevices();
      },
      error: () => {
        this.toast.error('Failed to rename device');
        this.editingDeviceId = null;
      }
    });
  }

  cancelEdit(): void {
    this.editingDeviceId = null;
    this.editNameValue = '';
  }

  getEffectivePeripheralStatus(device: HardwareDevice, peripheral: HardwarePeripheral): string {
    if (!this.isDeviceOnline(device)) return 'offline';
    return peripheral.status;
  }

  getOnlinePeripheralCount(device: HardwareDevice): number {
    if (!device.peripherals) return 0;
    return device.peripherals.filter(p => this.getEffectivePeripheralStatus(device, p) === 'online').length;
  }

  getTotalPeripheralCount(device: HardwareDevice): number {
    return device.peripherals ? device.peripherals.length : 0;
  }

  getPeripheralColor(status: string): string {
    switch (status) {
      case 'online': return '#1D9F00';
      case 'offline': return '#D92C2B';
      case 'error': return '#FE9A00';
      default: return '#86868B';
    }
  }

  getPeripheralLabel(type: string): string {
    switch (type) {
      case 'lcd': return 'LCD Display';
      case 'printer': return 'POS Printer';
      case 'buzzer': return 'Buzzer';
      case 'relay': return 'Relay';
      default: return type;
    }
  }

  getActiveDevices(): HardwareDevice[] {
    return this.devices.filter(d => d.state === 'active');
  }

  onDeviceTypeChange(selected: any[]): void {
    this.confirmType = selected[0]?.id || 'esp32';
  }

  // ── Pairing ──

  startPairing(): void {
    this.pairingActive = true;
    this.pairingCountdown = 120;
    this.hwMgmt.startPairing().subscribe({
      next: (res) => {
        this.toast.info('Pairing window opened for 2 minutes');
        this.pairingTimer = setInterval(() => {
          this.pairingCountdown--;
          if (this.pairingCountdown <= 0) this.stopPairing();
          this.cdr.detectChanges();
        }, 1000);
      },
      error: () => {
        this.toast.error('Failed to open pairing window');
        this.pairingActive = false;
      }
    });
  }

  stopPairing(): void {
    this.pairingActive = false;
    if (this.pairingTimer) {
      clearInterval(this.pairingTimer);
      this.pairingTimer = null;
    }
    this.hwMgmt.cancelPairing().subscribe({ error: () => {} });
  }

  // ── Pending Devices Polling ──

  private startPendingPolling(): void {
    this.loadPendingDevices();
    this.pendingPollingTimer = setInterval(() => this.loadPendingDevices(), 3000);
  }

  private stopPendingPolling(): void {
    if (this.pendingPollingTimer) {
      clearInterval(this.pendingPollingTimer);
      this.pendingPollingTimer = null;
    }
  }

  private loadPendingDevices(): void {
    this.hwMgmt.getDevices().subscribe({
      next: (devices) => {
        this.pendingDevices = devices
          .filter(d => d.state === 'pending')
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        this.subTabs = this.subTabs.map(t =>
          t.id === 'pairing'
            ? { ...t, count: this.pendingDevices.length > 0 ? this.pendingDevices.length : undefined }
            : t);
        this.cdr.detectChanges();
      },
      error: () => { /* silent — polling retries */ }
    });
  }

  confirmDevice(): void {
    if (!this.confirmName) {
      this.toast.warning('Enter a device name');
      return;
    }
    this.hwMgmt.pairDevice(this.confirmMac || '00:00:00:00:00:00', this.confirmName).subscribe({
      next: (device) => {
        this.hwMgmt.confirmDevice(device._id).subscribe({
          next: () => {
            this.toast.success('Device paired successfully');
            this.confirmMac = '';
            this.confirmName = '';
            this.confirmType = 'esp32';
            this.stopPairing();
            this.loadDevices();
          },
          error: () => this.toast.error('Confirmation failed')
        });
      },
      error: (err) => this.toast.error(err.error?.message || 'Pairing failed')
    });
  }

  // ── Peripheral Tests ──

  testPeripheral(deviceId: string, type: string): void {
    this.testingPeripheralDeviceId = deviceId;
    this.testingPeripheralType = type;
    this.hwMgmt.sendTestCommand(deviceId, type).subscribe({
      next: () => {
        this.toast.success(this.getPeripheralLabel(type) + ' test sent');
        this.testingPeripheralDeviceId = '';
        this.testingPeripheralType = '';
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Test failed');
        this.testingPeripheralDeviceId = '';
        this.testingPeripheralType = '';
      }
    });
  }

  isTesting(deviceId: string, type: string): boolean {
    return this.testingPeripheralDeviceId === deviceId && this.testingPeripheralType === type;
  }

  // ── Emergency Stop ──

  stopDevice(deviceId: string): void {
    this.hwMgmt.stopDevice(deviceId).subscribe({
      next: () => this.toast.info('Stop command sent'),
      error: () => this.toast.error('Failed to send stop command')
    });
  }

  // ── Approve pending device (created via API/Postman) ──

  approvePending(deviceId: string): void {
    this.confirmingDeviceId = deviceId;
    this.hwMgmt.confirmDevice(deviceId).subscribe({
      next: () => {
        this.toast.success('Device confirmed');
        this.confirmingDeviceId = '';
        this.loadDevices();
      },
      error: () => {
        this.toast.error('Failed to confirm device');
        this.confirmingDeviceId = '';
      }
    });
  }

  // ── Secret Rotation ──

  rotateSecret(deviceId: string): void {
    if (!confirm('Rotate HMAC secret for this device? All active connections will need to re-authenticate.')) return;
    this.rotatingDeviceId = deviceId;
    this.hwMgmt.rotateSecret(deviceId).subscribe({
      next: (res) => {
        this.toast.success('Secret rotated. Device will re-connect with new key.');
        this.rotatingDeviceId = '';
        this.loadDevices();
      },
      error: () => {
        this.toast.error('Failed to rotate secret');
        this.rotatingDeviceId = '';
      }
    });
  }
}
