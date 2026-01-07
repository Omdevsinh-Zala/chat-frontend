import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetView } from './asset-view';

describe('AssetView', () => {
  let component: AssetView;
  let fixture: ComponentFixture<AssetView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
