import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { ChannelList } from '../../models/chat';
import { Responsive } from '../../services/responsive';
import { UserService } from '../../services/user-service';
import { debounce, FormField, form, required, validateHttp } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { GlobalResponse } from '../../models/auth';
import { PaginatedResponse } from '../../models/search';
import { MatRipple } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ChannelInfo } from '../../dialogs/channel-info/channel-info';
import { ImageUrlPipe } from "../../image-url-pipe";

@Component({
  selector: 'app-channels-list',
  imports: [
    MatRadioModule,
    FormsModule,
    MatTableModule,
    MatPaginator,
    MatFormFieldModule,
    MatInput,
    FormField,
    MatRipple,
    ImageUrlPipe
],
  templateUrl: './channels-list.html',
  styleUrl: './channels-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelsList {
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private paginator = viewChild(MatPaginator);
  private dialog = inject(MatDialog);
  readonly responsive = inject(Responsive);

  readonly apiUrl: string = environment.apiUrl;

  readonly sortOrder = ['ASC', 'DESC'];

  sort = model<'ASC' | 'DESC'>('ASC');

  displayedColumns: string[] = ['channels'];

  channelsData: WritableSignal<ChannelList[]> = signal([]);
  resultsLength = signal(0);

  ngOnInit(): void {
    const defaultPageSize = 10;
    this.userService
      .getAllChannels(
        this.searchForm.search().value(),
        this.sort(),
        this.paginator()?.pageSize || defaultPageSize,
        (this.paginator()?.pageIndex || 0) + 1,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.channelsData.set(res.data?.data || []);
          this.resultsLength.set(res.data?.total || 0);
        },
      });
  }

  onSortOrderChange(value: 'ASC' | 'DESC') {
    this.userService
      .getAllChannels(
        this.searchForm.search().value(),
        value,
        this.paginator()?.pageSize || 10,
        (this.paginator()?.pageIndex || 0) + 1,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.channelsData.set(res.data?.data || []);
          this.resultsLength.set(res.data?.total || 0);
        },
      });
  }

  searchModel = signal<{ search: string }>({
    search: '',
  });

  searchForm = form(this.searchModel, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.search, { message: 'Search is required.' });

    validateHttp(schemaPath.search, {
      request: ({ value }) => {
        const params = new URLSearchParams();
        if (value()) params.append('search', value());
        if (this.sort()) params.append('order', this.sort());
        if (this.paginator()?.pageSize !== undefined)
          params.append(
            'limit',
            this.paginator()?.pageSize ? this.paginator()?.pageSize.toString()! : '15',
          );
        if (this.paginator()?.pageIndex !== undefined)
          params.append('page', (this.paginator()?.pageIndex! + 1).toString());

        const queryString = params.toString();
        const url = queryString
          ? `${this.apiUrl}/users/channels?${queryString}`
          : `${this.apiUrl}/users/channels`;
        return url;
      },
      onSuccess: (res: GlobalResponse<PaginatedResponse<ChannelList>>) => {
        if (res.success) {
          setTimeout(() => {
            this.channelsData.set(res.data?.data || []);
            this.resultsLength.set(res.data?.total || 0);
          }, 100);
        }
        return null;
      },
      onError: () => ({
        kind: 'networkError',
        message: 'Could not search users',
      }),
    });
  });

  ngAfterViewInit(): void {
    this.paginator()
      ?.page.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.userService
            .getAllChannels(
              this.searchForm.search().value(),
              this.sort(),
              event.pageSize,
              event.pageIndex + 1,
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (res) => {
                this.channelsData.set(res.data?.data || []);
                this.resultsLength.set(res.data?.total || 0);
              },
            });
        },
      });
  }

  openChannelDetail(id: string) {
    this.dialog.open(ChannelInfo, {
      data: { id },
      maxHeight: '100dvh',
      maxWidth: '100dvw',
      height: '70%',
      width: '70%',
    });
  }
}
