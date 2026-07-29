import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealSlotService, MealSlotWithCode } from '../../../../shared/services/meal-slot.service';
import { SubscriberFormService, SubscriberFormValue } from '../../../../shared/services/subscriber-form.service';
import { ButtonComponent } from '@libs/shared-ui';
import { SubscriberFormComponent } from '../subscriber-form/subscriber-form.component';

@Component({
  selector: 'app-add-subscriber-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SubscriberFormComponent, ButtonComponent],
  templateUrl: './add-subscriber-modal.component.html',
  styleUrls: ['./add-subscriber-modal.component.css']
})
export class AddSubscriberModalComponent implements OnChanges, OnDestroy {

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.onClose();
    }
  }

  @ViewChild(SubscriberFormComponent) formComponent!: SubscriberFormComponent;

  constructor(
    private mealSlotService: MealSlotService,
    private formService: SubscriberFormService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() viewStudent = new EventEmitter<string>();

  mealSlots: MealSlotWithCode[] = [];

  formValid = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;
    const appRoot = document.querySelector('app-root') as HTMLElement;
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (appRoot) {
        appRoot.style.height = '100vh';
        appRoot.style.overflow = 'hidden';
      }
      this.fetchMealSlots();
    } else {
      this.unlockScroll();
    }
  }

  fetchMealSlots() {
    this.mealSlotService.getMealSlots(true).subscribe((slots: MealSlotWithCode[]) => {
      this.mealSlots = slots;
      this.cdr.detectChanges();
    });
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
    this.close.emit();
  }

  onSave(form: SubscriberFormValue): void {
    this.save.emit(form);
  }

  onFormValidChange(valid: boolean): void {
    this.formValid = valid;
  }

  onViewExistingStudent(admissionNumber: string): void {
    this.viewStudent.emit(admissionNumber);
  }
}
