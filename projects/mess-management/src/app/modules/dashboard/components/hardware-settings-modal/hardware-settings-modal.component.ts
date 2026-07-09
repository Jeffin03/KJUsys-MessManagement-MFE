import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, EmptyStateComponent } from '@libs/shared-ui';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { SharedToastService } from '@libs/shared-toast';
import { HardwareManagementService, HardwareDevice, HardwarePeripheral } from '../../../../shared/services/hardware-management.service';

@Component({
  selector: 'app-hardware-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, DropdownLibModule, EmptyStateComponent],
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

  devices: HardwareDevice[] = [];
  isLoading = false;

  registerMac = '';
  registerName = '';
  registerType = 'esp32';
  isRegistering = false;

  showHmacPopup = false;
  hmacSecret = '';
  hmacSecretHash = '';
  hmacCopied = false;
  hmacHashCopied = false;

  selectedDeviceType: any[] = [];
  testingPeripheralDeviceId = '';
  testingPeripheralType = '';

  rotatingDeviceId = '';
  confirmingDeviceId = '';
  editingDeviceId: string | null = null;
  editNameValue = '';

  showDeleteConfirmPopup = false;
  pendingDeleteDevice: HardwareDevice | null = null;

  showRotateConfirmPopup = false;
  pendingRotateDevice: HardwareDevice | null = null;

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
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
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
    this.resetRegisterForm();
    this.close.emit();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.hwMgmt.getDevices().subscribe({
      next: (devices) => {
        this.devices = devices;
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
    this.registerType = selected[0]?.id || 'esp32';
  }

  // ── Register Device ──

  registerDevice(): void {
    if (!this.registerName.trim()) {
      this.toast.warning('Enter a device name');
      return;
    }
    this.isRegistering = true;
    const mac = this.registerMac.trim() || '00:00:00:00:00:00';
    this.hwMgmt.connectDevice(mac, this.registerName.trim(), this.registerType).subscribe({
      next: (res) => {
        this.isRegistering = false;
        this.hmacSecret = res.hmacSecret;
        this.hmacSecretHash = res.hmacSecretHash;
        this.hmacCopied = false;
        this.hmacHashCopied = false;
        this.showHmacPopup = true;
        this.resetRegisterForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isRegistering = false;
        this.toast.error(err.error?.message || 'Registration failed');
      }
    });
  }

  private resetRegisterForm(): void {
    this.registerMac = '';
    this.registerName = '';
    this.registerType = 'esp32';
    this.selectedDeviceType = [];
  }

  // ── HMAC Popup ──

  copyHmacSecret(): void {
    navigator.clipboard.writeText(this.hmacSecret).then(() => {
      this.hmacCopied = true;
      this.toast.success('HMAC Secret copied to clipboard');
      this.cdr.detectChanges();
      setTimeout(() => { this.hmacCopied = false; this.cdr.detectChanges(); }, 2000);
    });
  }

  copyHmacHash(): void {
    navigator.clipboard.writeText(this.hmacSecretHash).then(() => {
      this.hmacHashCopied = true;
      this.toast.success('Device Token copied to clipboard');
      this.cdr.detectChanges();
      setTimeout(() => { this.hmacHashCopied = false; this.cdr.detectChanges(); }, 2000);
    });
  }

  closeHmacPopup(): void {
    this.showHmacPopup = false;
    this.hmacSecret = '';
    this.hmacSecretHash = '';
    this.hmacCopied = false;
    this.hmacHashCopied = false;
    this.loadDevices();
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

  requestRotateSecret(device: HardwareDevice): void {
    this.pendingRotateDevice = device;
    this.showRotateConfirmPopup = true;
  }

  cancelRotateSecret(): void {
    this.showRotateConfirmPopup = false;
    this.pendingRotateDevice = null;
  }

  confirmRotateSecret(): void {
    if (!this.pendingRotateDevice) return;
    const deviceId = this.pendingRotateDevice._id;
    this.showRotateConfirmPopup = false;
    this.pendingRotateDevice = null;
    this.rotatingDeviceId = deviceId;
    this.hwMgmt.rotateSecret(deviceId).subscribe({
      next: (res) => {
        this.rotatingDeviceId = '';
        this.hmacSecret = res.newSecret;
        this.hmacSecretHash = res.newSecretHash;
        this.hmacCopied = false;
        this.hmacHashCopied = false;
        this.showHmacPopup = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to rotate secret');
        this.rotatingDeviceId = '';
      }
    });
  }
}
