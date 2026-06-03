import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubTabsComponent } from './sub-tabs.component';

describe('SubTabsComponent', () => {
  let component: SubTabsComponent;
  let fixture: ComponentFixture<SubTabsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubTabsComponent]
    });
    fixture = TestBed.createComponent(SubTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
