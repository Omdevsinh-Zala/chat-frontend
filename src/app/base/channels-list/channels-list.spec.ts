import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelsList } from './channels-list';

describe('ChannelsList', () => {
  let component: ChannelsList;
  let fixture: ComponentFixture<ChannelsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
