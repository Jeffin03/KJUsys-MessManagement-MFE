import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriberCardPreviewComponent } from '../subscriber-card-preview/subscriber-card-preview.component';

@Component({
  selector: 'app-subscriber-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SubscriberCardPreviewComponent],
  templateUrl: './subscriber-card-modal.component.html',
  styleUrls: ['./subscriber-card-modal.component.css']
})
export class SubscriberCardModalComponent implements OnChanges, OnDestroy {

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.onClose();
  }

  @Input() subscriber: any;
  @Output() previous = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  hmsId = '';
  hmsIdError = '';

  ngOnChanges(changes: SimpleChanges): void {
    const appRoot = document.querySelector('app-root') as HTMLElement;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (appRoot) {
      appRoot.style.height = '100vh';
      appRoot.style.overflow = 'hidden';
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

  onHmsIdChange(): void {
    this.hmsId = this.hmsId.toUpperCase();

    if (this.hmsId.length === 0) {
      this.hmsIdError = '';
      return;
    }

    const hmsRegex = /^[A-Z]{0,3}[0-9]{0,3}$/;
    const fullRegex = /^[A-Z]{3}[0-9]{3}$/;

    if (!hmsRegex.test(this.hmsId)) {
      this.hmsIdError = 'Format must be 3 letters followed by 3 numbers (e.g. ABH976)';
    } else if (this.hmsId.length === 6 && !fullRegex.test(this.hmsId)) {
      this.hmsIdError = 'Format must be 3 letters followed by 3 numbers (e.g. ABH976)';
    } else {
      this.hmsIdError = '';
    }
  }

  onPrevious(): void {
    this.unlockScroll();
    this.previous.emit();
  }

  onClose(): void {
    this.unlockScroll();
    this.close.emit();
  }

  onSave(): void {
    this.unlockScroll();
    this.save.emit({ ...this.subscriber, hmsId: this.hmsId });
  }
}