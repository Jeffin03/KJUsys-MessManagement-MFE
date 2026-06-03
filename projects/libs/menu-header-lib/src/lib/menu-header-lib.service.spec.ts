import { TestBed } from '@angular/core/testing';

import { MenuHeaderLibService } from './menu-header-lib.service';

describe('MenuHeaderLibService', () => {
  let service: MenuHeaderLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuHeaderLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
