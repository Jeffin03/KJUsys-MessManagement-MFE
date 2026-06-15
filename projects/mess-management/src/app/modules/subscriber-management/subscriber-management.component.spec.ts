import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriberManagementComponent } from './subscriber-management.component';

describe('SubscriberManagementComponent', () => {
  let component: SubscriberManagementComponent;
  let fixture: ComponentFixture<SubscriberManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubscriberManagementComponent]
    });
    fixture = TestBed.createComponent(SubscriberManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
