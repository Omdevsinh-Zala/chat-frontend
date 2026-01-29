import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteJoinDialog } from './invite-join-dialog';

describe('InviteJoinDialog', () => {
  let component: InviteJoinDialog;
  let fixture: ComponentFixture<InviteJoinDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteJoinDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteJoinDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
