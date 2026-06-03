import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownLibComponent } from './dropdown-lib.component';

describe('DropdownLibComponent', () => {
  let component: DropdownLibComponent;
  let fixture: ComponentFixture<DropdownLibComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DropdownLibComponent]
    });
    fixture = TestBed.createComponent(DropdownLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
