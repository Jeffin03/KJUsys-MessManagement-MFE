import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriberCardPreviewComponent } from './subscriber-card-preview.component';

describe('SubscriberCardPreviewComponent', () => {
  let component: SubscriberCardPreviewComponent;
  let fixture: ComponentFixture<SubscriberCardPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubscriberCardPreviewComponent]
    });
    fixture = TestBed.createComponent(SubscriberCardPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
