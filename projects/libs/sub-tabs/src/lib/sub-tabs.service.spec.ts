import { TestBed } from '@angular/core/testing';

import { SubTabsService } from './sub-tabs.service';

describe('SubTabsService', () => {
  let service: SubTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
