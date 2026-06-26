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
import { SubscriberFormComponent } from '../subscriber-form/subscriber-form.component';
import { ButtonComponent } from '@libs/shared-ui';
import { SubscriberService } from '../../services/subscriber.service';

@Component({
  selector: 'app-edit-subscriber-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SubscriberFormComponent, ButtonComponent],
  templateUrl: './edit-subscriber-modal.component.html',
  styleUrls: ['./edit-subscriber-modal.component.css']
})
export class EditSubscriberModalComponent implements OnChanges, OnDestroy {

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
    private subscriberService: SubscriberService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() isOpen = false;
  @Input() subscriber: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<any>();
  @Output() next = new EventEmitter<any>();

  mealSlots: MealSlotWithCode[] = [];
  initialFormValue?: SubscriberFormValue;
  formValid = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen'] && !changes['subscriber']) return;

    if (this.isOpen) {
      this.fetchMealSlots();
    }

    const appRoot = document.querySelector('app-root') as HTMLElement;
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (appRoot) {
        appRoot.style.height = '100vh';
        appRoot.style.overflow = 'hidden';
      }
    } else {
      this.unlockScroll();
    }
  }

  fetchMealSlots() {
    this.mealSlotService.getMealSlots(true).subscribe({
      next: (slots: MealSlotWithCode[]) => {
        this.mealSlots = slots;
        if (this.subscriber) {
          this.initialFormValue = this.formService.populateForm(this.subscriber, slots);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch meal schedules', err);
      }
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

  onUpdate(form: SubscriberFormValue): void {
    this.update.emit(form);
  }

  onNext(form: SubscriberFormValue): void {
    this.next.emit(form);
  }

  onFormValidChange(valid: boolean): void {
    this.formValid = valid;
  }
}
