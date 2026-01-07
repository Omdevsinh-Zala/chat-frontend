import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleAsset } from './single-asset';

describe('SingleAsset', () => {
  let component: SingleAsset;
  let fixture: ComponentFixture<SingleAsset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleAsset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleAsset);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
