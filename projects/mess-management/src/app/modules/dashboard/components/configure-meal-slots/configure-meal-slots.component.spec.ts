import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureMealSlotsComponent } from './configure-meal-slots.component';

describe('ConfigureMealSlotsComponent', () => {
  let component: ConfigureMealSlotsComponent;
  let fixture: ComponentFixture<ConfigureMealSlotsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigureMealSlotsComponent]
    });
    fixture = TestBed.createComponent(ConfigureMealSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
