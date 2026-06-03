import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillTabsComponent } from './pill-tabs.component';

describe('PillTabsComponent', () => {
  let component: PillTabsComponent;
  let fixture: ComponentFixture<PillTabsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PillTabsComponent]
    });
    fixture = TestBed.createComponent(PillTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
