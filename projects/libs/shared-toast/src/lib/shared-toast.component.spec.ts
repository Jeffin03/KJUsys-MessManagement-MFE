import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedToastComponent } from './shared-toast.component';

describe('SharedToastComponent', () => {
  let component: SharedToastComponent;
  let fixture: ComponentFixture<SharedToastComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SharedToastComponent]
    });
    fixture = TestBed.createComponent(SharedToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
