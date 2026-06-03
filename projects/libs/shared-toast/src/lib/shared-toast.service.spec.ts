import { TestBed } from '@angular/core/testing';

import { SharedToastService } from './shared-toast.service';

describe('SharedToastService', () => {
  let service: SharedToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
