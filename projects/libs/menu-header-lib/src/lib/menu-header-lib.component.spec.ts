import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuHeaderLibComponent } from './menu-header-lib.component';

describe('MenuHeaderLibComponent', () => {
  let component: MenuHeaderLibComponent;
  let fixture: ComponentFixture<MenuHeaderLibComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MenuHeaderLibComponent]
    });
    fixture = TestBed.createComponent(MenuHeaderLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
