import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() type: 'no-images' | 'no-documents' | 'no-results' | 'setup-completed' | 'oops' | 'no-internet' | 'no-messages' | 'caught-up' = 'no-results';
  @Input() subtext: string = '';
  @Input() title: string = '';

  getIllustration() {
    const basePath = 'assets/library-state-illustrations/';
    switch (this.type) {
      case 'no-images': return `${basePath}no-images.png`;
      case 'no-documents': return `${basePath}no-documents.png`;
      case 'no-results': return `${basePath}no-results.png`;
      case 'setup-completed': return `${basePath}setup-completed.png`;
      case 'oops': return `${basePath}oops.png`;
      case 'no-internet': return `${basePath}no-internet.png`;
      case 'no-messages': return `${basePath}no-messages.png`;
      case 'caught-up': return `${basePath}caught-up.png`;
      default: return `${basePath}no-results.png`;
    }
  }

  getDisplayTitle() {
    if (this.title) return this.title;
    switch (this.type) {
      case 'no-images': return 'No images';
      case 'no-documents': return 'No documents';
      case 'no-results': return 'No results found';
      case 'setup-completed': return 'Setup completed';
      case 'oops': return 'Oops!';
      case 'no-internet': return 'No internet connection';
      case 'no-messages': return 'No messages';
      case 'caught-up': return "You're all caught up!";
      default: return 'No results found';
    }
  }
}
