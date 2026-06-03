import { TestBed } from '@angular/core/testing';

import { MfeCommonService } from './mfe-common.service';

describe('MfeCommonService', () => {
  let service: MfeCommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MfeCommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
