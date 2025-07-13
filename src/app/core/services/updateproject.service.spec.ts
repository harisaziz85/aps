import { TestBed } from '@angular/core/testing';

import { UpdateprojectService } from './updateproject.service';

describe('UpdateprojectService', () => {
  let service: UpdateprojectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateprojectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
