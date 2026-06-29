import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TabsModule } from '@libs/tabs';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';

import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportsComponent],
      imports: [
        RouterTestingModule,
        TabsModule,
        BreadcrumbsTitleComponent
      ]
    });
    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
