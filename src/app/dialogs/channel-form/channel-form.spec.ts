import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelForm } from './channel-form';

describe('ChannelForm', () => {
  let component: ChannelForm;
  let fixture: ComponentFixture<ChannelForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
