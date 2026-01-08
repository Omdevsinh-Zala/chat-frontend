import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  inject,
  model,
  OnInit,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { UserService } from '../../services/user-service';
import { MatPaginator } from '@angular/material/paginator';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { AttachmentsType } from '../../models/chat';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { Responsive } from '../../services/responsive';

@Component({
  selector: 'app-files',
  imports: [MatRadioModule, FormsModule, MatTableModule, MatPaginator, MatIcon],
  templateUrl: './files.html',
  styleUrl: './files.css',
})
export class Files implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private paginator = viewChild(MatPaginator);
  readonly responsive = inject(Responsive);

  readonly apiUrl: string = environment.apiUrl;
  readonly imagePath: string = environment.imageUrl;

  readonly sortOrder = ['ASC', 'DESC'];

  sort = model<'ASC' | 'DESC'>('ASC');

  displayedColumns: string[] = ['files'];

  filesData: WritableSignal<AttachmentsType[]> = signal([]);
  resultsLength = signal(0);

  ngOnInit(): void {
    const defaultPageSize = 10;
    const defaultPageIndex = 1;
    this.userService
      .getAllFiles(
        this.sort(),
        this.paginator()?.pageSize || defaultPageSize,
        (this.paginator()?.pageIndex || 0) + 1
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.filesData.set(res.data?.data || []);
          this.resultsLength.set(res.data?.total || 0);
        },
      });
  }

  onSortOrderChange(value: 'ASC' | 'DESC') {
    this.userService
      .getAllFiles(value, this.paginator()?.pageSize || 10, (this.paginator()?.pageIndex || 0) + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.filesData.set(res.data?.data || []);
          this.resultsLength.set(res.data?.total || 0);
        },
      });
  }

  ngAfterViewInit(): void {
    this.paginator()
      ?.page.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.userService
            .getAllFiles(this.sort(), event.pageSize, event.pageIndex + 1)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (res) => {
                this.filesData.set(res.data?.data || []);
                this.resultsLength.set(res.data?.total || 0);
              },
            });
        },
      });
  }
}
