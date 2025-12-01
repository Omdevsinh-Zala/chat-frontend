import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageSnackBar } from './message-snack-bar';

describe('MessageSnackBar', () => {
  let component: MessageSnackBar;
  let fixture: ComponentFixture<MessageSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageSnackBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageSnackBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
