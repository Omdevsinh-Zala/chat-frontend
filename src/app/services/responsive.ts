import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Responsive {
  private breakpointObserver = inject(BreakpointObserver);

  isTabletForBase = signal(false);
  isTabletForHome = signal(false);

  basePanelOpen = signal(false);
  homePanelOpen = signal(false);

  forSettingDialog = signal(false);

  breakpointsToObserve = signal(['(max-width: 839.98px)', '(max-width: 1200px)'])

  constructor() {
    this.breakpointObserver
      .observe(this.breakpointsToObserve())
      .subscribe((result) => {
        if (result) {
          this.isTabletForBase.set(result.breakpoints[this.breakpointsToObserve()[0]]);
          this.isTabletForHome.set(result.breakpoints[this.breakpointsToObserve()[0]]);
          this.forSettingDialog.set(result.breakpoints[this.breakpointsToObserve()[1]]);
        } else {
          this.isTabletForBase.set(false);
          this.isTabletForHome.set(false);
          this.forSettingDialog.set(false);
        }
      });
  }
}
