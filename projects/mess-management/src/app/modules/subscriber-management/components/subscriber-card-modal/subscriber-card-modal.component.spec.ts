import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriberCardModalComponent } from './subscriber-card-modal.component';

describe('SubscriberCardModalComponent', () => {
  let component: SubscriberCardModalComponent;
  let fixture: ComponentFixture<SubscriberCardModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubscriberCardModalComponent]
    });
    fixture = TestBed.createComponent(SubscriberCardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
