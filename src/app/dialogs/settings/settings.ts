import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  Signal,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PanelGroup } from '../../models/preferences';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-settings',
  imports: [
    MatSidenavModule,
    MatIcon,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    NgTemplateOutlet,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<Settings>);

  constructor() {
    effect(() => {
      this.visiblePanelFragment = this.panelGroup().find(
        (panelGroup) => panelGroup.isOpen
      )?.fragments;
      this.isDynamicContentChange = this.panelGroup().find(
        (panelGroup) => panelGroup.isOpen
      )?.isDynamic;
    });
  }

  matThemes = signal([
    {
      name: 'Azure',
      class: 'azure-theme',
      isActive: true,
    },
    {
      name: 'Red',
      class: 'red-theme',
      isActive: false,
    },
    {
      name: 'Green',
      class: 'green-theme',
      isActive: false,
    },
    {
      name: 'Blue',
      class: 'blue-theme',
      isActive: false,
    },
    {
      name: 'Yellow',
      class: 'yellow-theme',
      isActive: false,
    },
    {
      name: 'Cyan',
      class: 'cyan-theme',
      isActive: false,
    },
    {
      name: 'Magenta',
      class: 'magenta-theme',
      isActive: false,
    },
    {
      name: 'Orange',
      class: 'orange-theme',
      isActive: false,
    },
    {
      name: 'Chartreuse',
      class: 'chartreuse-theme',
      isActive: false,
    },
    {
      name: 'Spring green',
      class: 'spring-green-theme',
      isActive: false,
    },
    {
      name: 'violet',
      class: 'violet-theme',
      isActive: false,
    },
    {
      name: 'rose',
      class: 'rose-theme',
      isActive: false,
    },
    {
      name: 'midnight',
      class: 'midnight-theme',
      isActive: false,
    },
    {
      name: 'sunset',
      class: 'sunset-theme',
      isActive: false,
    },
    {
      name: 'forest',
      class: 'forest-theme',
      isActive: false,
    },
    {
      name: 'lavender',
      class: 'lavender-theme',
      isActive: false,
    },
    {
      name: 'Indigo Electric',
      class: 'indigo-electric-theme',
      isActive: false,
    },
    {
      name: 'Solar Citrus',
      class: 'solar-citrus-theme',
      isActive: false,
    },
    {
      name: 'Neon Mint',
      class: 'neon-mint-theme',
      isActive: false,
    },
    {
      name: 'Berry Blast',
      class: 'berry-blast-theme',
      isActive: false,
    },
    {
      name: 'Aurora',
      class: 'aurora-theme',
      isActive: false,
    },
    {
      name: 'Cosmic Fusion',
      class: 'cosmic-fusion-theme',
      isActive: false,
      gradient: 'linear-gradient(135deg, #13072e 0%, #3f2b96 50%, #a8c0ff 100%)',
    },
    {
      name: 'Ocean Breeze',
      class: 'ocean-breeze-theme',
      isActive: false,
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    },
    {
      name: 'Midnight Ember',
      class: 'midnight-ember-theme',
      isActive: false,
      gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    },
    {
      name: 'Tropical Sunset',
      class: 'tropical-sunset-theme',
      isActive: false,
      gradient: 'linear-gradient(135deg, #fc00ff 0%, #00dbde 100%)',
    },
    {
      name: 'Cyberpunk',
      class: 'cyberpunk-theme',
      isActive: false,
      gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    },
  ]);

  getThemePreview(theme: any) {
    if (theme.gradient) {
      return theme.gradient;
    }
    return ''; // Will fall back to CSS class split preview
  }

  isGlassEnabled = signal(false);

  selectedMatTheme() {
    const bodyElement = window.document.getElementsByTagName('html')[0];
    const index = this.matThemes().findIndex((t) => bodyElement.classList.contains(t.class));
    if (index === -1) {
      this.matThemes.update((themes) => themes.map((t, i) => ({ ...t, isActive: i === 0 })));
    } else {
      this.matThemes.update((themes) => themes.map((t, i) => ({ ...t, isActive: i === index })));
      localStorage.setItem('matTheme', this.matThemes()[index].class);
    }

    // Initialize glass mode
    const isGlass = bodyElement.classList.contains('glass-theme');
    this.isGlassEnabled.set(isGlass);
  }

  matThemeChange(theme: any) {
    this.matThemes.update((themes) =>
      themes.map((t) => ({ ...t, isActive: t.name === theme.name }))
    );

    const bodyElement = window.document.getElementsByTagName('html')[0];
    // Remove all previous mat-theme classes
    this.matThemes().forEach((t) => {
      bodyElement.classList.remove(t.class);
    });

    bodyElement.classList.add(theme.class);
    localStorage.setItem('matTheme', theme.class);
  }

  toggleGlass() {
    const bodyElement = window.document.getElementsByTagName('html')[0];
    const newState = !this.isGlassEnabled();
    this.isGlassEnabled.set(newState);

    if (newState) {
      bodyElement.classList.add('glass-theme');
      localStorage.setItem('isGlassEnabled', 'true');
    } else {
      bodyElement.classList.remove('glass-theme');
      localStorage.setItem('isGlassEnabled', 'false');
    }
  }

  systemThemes = signal([
    {
      icon: 'light_mode',
      name: 'Light',
      class: 'light-theme',
      isActive: false,
    },
    {
      icon: 'dark_mode',
      name: 'Dark',
      class: 'dark-theme',
      isActive: false,
    },
    {
      icon: 'laptop',
      name: 'System',
      class: 'system-theme',
      isActive: true,
    },
  ]);

  systemThemeChange(theme: any) {
    this.systemThemes.update((themes) =>
      themes.map((t) => ({ ...t, isActive: t.name === theme.name }))
    );

    const bodyElement = window.document.getElementsByTagName('html')[0];
    // Remove all previous system-theme classes
    this.systemThemes().forEach((t) => {
      bodyElement.classList.remove(t.class);
    });
    if (theme.name === 'System') {
      localStorage.removeItem('systemTheme');
    } else {
      bodyElement.classList.add(theme.class);
      localStorage.setItem('systemTheme', theme.class);
    }
  }

  selectSystemTheme() {
    const bodyElement = window.document.getElementsByTagName('html')[0];
    if (bodyElement.classList.contains('light-theme')) {
      this.systemThemes.update((themes) =>
        themes.map((t) => ({ ...t, isActive: t.name === 'Light' }))
      );
    } else if (bodyElement.classList.contains('dark-theme')) {
      this.systemThemes.update((themes) =>
        themes.map((t) => ({ ...t, isActive: t.name === 'Dark' }))
      );
    } else {
      this.systemThemes.update((themes) =>
        themes.map((t) => ({ ...t, isActive: t.name === 'System' }))
      );
    }
  }

  ngAfterViewInit(): void {
    this.selectedMatTheme();
    this.selectSystemTheme();

    this.panelGroup.update(() => [
      {
        index: 0,
        name: 'Appearance',
        icon: 'brush',
        isOpen: true,
        fragments: this.settingFragment()!,
        isDynamic: true,
      },
      {
        index: 1,
        name: 'Notifications',
        icon: 'notifications',
        isOpen: false,
        fragments: this.notificationFragment()!,
        isDynamic: true,
      },
    ]);

    const bodyElement = document.body;

    // Place this logic in app.ts
    this.systemThemes().forEach((theme) => {
      if (theme.isActive && theme.name === 'Light') {
        bodyElement.classList.add('light-theme');
        bodyElement.classList.remove('dark-theme');
      } else if (theme.isActive && theme.name === 'Dark') {
        bodyElement.classList.remove('light-theme');
        bodyElement.classList.add('dark-theme');
      } else {
        bodyElement.classList.remove('light-theme');
        bodyElement.classList.remove('dark-theme');
      }
    });
  }

  visiblePanelFragment: TemplateRef<any> | null | undefined = null;
  isDynamicContentChange: boolean | null | undefined = null;

  settingFragment = viewChild<TemplateRef<unknown>>('settingFragment');
  notificationFragment = viewChild<TemplateRef<unknown>>('notificationFragment');

  panelGroup: WritableSignal<PanelGroup[]> = signal([]);

  close() {
    this.dialogRef.close();
  }
}
