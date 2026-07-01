import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriberCardPreviewComponent } from '../subscriber-card-preview/subscriber-card-preview.component';
import { ButtonComponent } from '@libs/shared-ui';

@Component({
  selector: 'app-subscriber-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SubscriberCardPreviewComponent, ButtonComponent],
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

  roll_number = '';
  roll_numberError = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    const appRoot = document.querySelector('app-root') as HTMLElement;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (appRoot) {
      appRoot.style.height = '100vh';
      appRoot.style.overflow = 'hidden';
    }
    this.cdr.detectChanges();
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

  onRollNumberChange(): void {
    if (this.roll_number.length === 0) {
      this.roll_numberError = '';
      return;
    }
    this.roll_numberError = '';
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
    this.save.emit({ ...this.subscriber, roll_number: this.roll_number });
  }
}