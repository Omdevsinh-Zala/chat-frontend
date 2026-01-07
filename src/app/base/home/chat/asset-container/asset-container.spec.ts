import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetContainer } from './asset-container';

describe('AssetContainer', () => {
  let component: AssetContainer;
  let fixture: ComponentFixture<AssetContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
