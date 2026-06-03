import { TestBed } from '@angular/core/testing';

import { DropdownLibService } from './dropdown-lib.service';

describe('DropdownLibService', () => {
  let service: DropdownLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropdownLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
