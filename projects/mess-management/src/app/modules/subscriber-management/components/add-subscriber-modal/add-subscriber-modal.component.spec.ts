import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubscriberModalComponent } from './add-subscriber-modal.component';

describe('AddSubscriberModalComponent', () => {
  let component: AddSubscriberModalComponent;
  let fixture: ComponentFixture<AddSubscriberModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSubscriberModalComponent]
    });
    fixture = TestBed.createComponent(AddSubscriberModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
