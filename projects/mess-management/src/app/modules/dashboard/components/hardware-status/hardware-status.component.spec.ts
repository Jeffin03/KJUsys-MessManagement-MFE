import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardwareStatusComponent } from './hardware-status.component';

describe('HardwareStatusComponent', () => {
  let component: HardwareStatusComponent;
  let fixture: ComponentFixture<HardwareStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HardwareStatusComponent]
    });
    fixture = TestBed.createComponent(HardwareStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
