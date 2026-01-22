import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cropper } from './cropper';

describe('Cropper', () => {
  let component: Cropper;
  let fixture: ComponentFixture<Cropper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cropper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cropper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
