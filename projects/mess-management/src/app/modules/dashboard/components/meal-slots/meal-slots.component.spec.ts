import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealSlotsComponent } from './meal-slots.component';

describe('MealSlotsComponent', () => {
  let component: MealSlotsComponent;
  let fixture: ComponentFixture<MealSlotsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MealSlotsComponent]
    });
    fixture = TestBed.createComponent(MealSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
