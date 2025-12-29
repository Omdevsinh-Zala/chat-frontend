import { AfterViewInit, Component, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounce, form, required, validateHttp } from '@angular/forms/signals';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user-service';
import { PaginatedResponse, SearchUserResponse } from '../../models/search';
import { GlobalResponse } from '../../models/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacts',
  imports: [MatTableModule, MatPaginatorModule, MatRippleModule, RouterLink],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private paginator = viewChild(MatPaginator);

  apiUrl = environment.apiUrl;
  imagePath = environment.imageUrl;

  displayedColumns = ['user']

  resultsLength = signal(0);

  usersData = signal<SearchUserResponse[]>([]);

  searchModel = signal({
    search: '',
  })

  searchForm = form(
    this.searchModel,
    (schemaPath) => {
      debounce(schemaPath, 300);
      required(schemaPath, { message: 'Search is required.' });

      validateHttp(schemaPath.search, {
      request: ({ value }) => {
        const params = new URLSearchParams();
        if (value()) params.append('search', value());
        if (this.paginator()?.pageSize !== undefined) params.append('limit', this.paginator()?.pageSize ? this.paginator()?.pageSize.toString()! : '15');
        if (this.paginator()?.pageIndex !== undefined) params.append('page', (this.paginator()?.pageIndex! + 1).toString());
        
        const queryString = params.toString();
        const url = queryString ? `${this.apiUrl}/users?${queryString}` : `${this.apiUrl}/users`;
        return url;
      },
      onSuccess: (res: GlobalResponse<PaginatedResponse<SearchUserResponse>>) => {
        if (res.success) {
          this.usersData.set(res.data?.data || []);
          this.resultsLength.set(res.data?.total || 0);
        }
        return null;
      },
      onError: () => ({
        kind: 'networkError',
        message: 'Could not search users',
      }),
    });
    }
  )

  ngOnInit(): void {
    this.userService.searchUser('', this.paginator()?.pageSize, this.paginator()?.pageIndex! + 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.usersData.set(res.data?.data || []);
        this.resultsLength.set(res.data?.total || 0);
      },
    });
  }

  ngAfterViewInit(): void {
    this.paginator()?.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.userService.searchUser('', this.paginator()?.pageSize, this.paginator()?.pageIndex).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (res) => {
            this.usersData.set(res.data?.data || []);
            this.resultsLength.set(res.data?.total || 0);
          },
        });
      },
    });
  }
}
