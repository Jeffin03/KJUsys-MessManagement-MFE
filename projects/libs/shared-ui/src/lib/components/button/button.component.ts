import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() label: string = 'Button';
  @Input() type: 'primary' | 'secondary' | 'reject' | 'green' = 'primary';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() customClass: string = '';
  
  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled && !this.loading) {
      this.onClick.emit();
    }
  }

  getButtonClasses() {
    const baseClasses = 'px-7 py-3 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
    
    let variantClasses = '';
    switch (this.type) {
      case 'primary':
        variantClasses = 'bg-[#1A56DB] hover:bg-[#1E429F] text-white';
        break;
      case 'secondary':
        variantClasses = 'bg-white border border-gray-200 hover:bg-gray-50 text-[#374151]';
        break;
      case 'reject':
        variantClasses = 'bg-[#C81E1E] hover:bg-[#9B1C1C] text-white';
        break;
      case 'green':
        variantClasses = 'bg-[#057A55] hover:bg-[#046C4E] text-white';
        break;
      default:
        variantClasses = 'bg-[#1A56DB] hover:bg-[#1E429F] text-white';
    }

    return `${baseClasses} ${variantClasses} ${this.customClass}`;
  }
}
