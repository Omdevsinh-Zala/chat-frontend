import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiAssets } from './multi-assets';

describe('MultiAssets', () => {
  let component: MultiAssets;
  let fixture: ComponentFixture<MultiAssets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiAssets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiAssets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
