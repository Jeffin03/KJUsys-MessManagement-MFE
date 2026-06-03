import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpCommonComponent } from './http-common.component';

describe('HttpCommonComponent', () => {
  let component: HttpCommonComponent;
  let fixture: ComponentFixture<HttpCommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HttpCommonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HttpCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
