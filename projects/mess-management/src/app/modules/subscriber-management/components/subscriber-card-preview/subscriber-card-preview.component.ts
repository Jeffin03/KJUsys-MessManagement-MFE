import { Component, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriber-card-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriber-card-preview.component.html'
})
export class SubscriberCardPreviewComponent implements OnChanges {
  @Input() admission_number = '';
  @Input() subscriberName = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.cdr.detectChanges();
  }
}