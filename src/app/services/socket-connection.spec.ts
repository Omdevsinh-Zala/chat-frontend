import { TestBed } from '@angular/core/testing';

import { SocketConnection } from './socket-connection';

describe('SocketConnection', () => {
  let service: SocketConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
