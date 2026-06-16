import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriber-card-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriber-card-preview.component.html'
})
export class SubscriberCardPreviewComponent {
  @Input() roll_number = '';
  @Input() subscriberName = '';
}