import { TestBed } from '@angular/core/testing';

import { PillTabsService } from './pill-tabs.service';

describe('PillTabsService', () => {
  let service: PillTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PillTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
