import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { CasesService } from '../../services/cases.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cases-list',
  templateUrl: './cases-list.component.html',
  styleUrls: ['./cases-list.component.scss']
})
export class CasesListComponent implements OnInit {
  displayedColumns: string[] = ['caseNumber', 'title', 'client', 'status', 'court', 'nextSession', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private casesService: CasesService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCases();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCases() {
    this.isLoading = true;
    this.casesService.getCases().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message;
        this.isLoading = false;
        this.showErrorMessage();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewCase(id: string) {
    this.router.navigate(['/cases/details', id]);
  }

  editCase(id: string) {
    this.router.navigate(['/cases/edit', id]);
  }

  deleteCase(id: string) {
    const confirmMessage = this.translate.instant('CASES.DELETE_CONFIRM');
    if (confirm(confirmMessage)) {
      this.casesService.deleteCase(id).subscribe({
        next: () => {
          this.loadCases();
          this.showSuccessMessage('CASES.DELETE_SUCCESS');
        },
        error: (error) => {
          this.error = error.message;
          this.showErrorMessage();
        }
      });
    }
  }

  createNewCase() {
    this.router.navigate(['/cases/new']);
  }

  viewSessions(id: string) {
    this.router.navigate(['/cases/sessions', id]);
  }

  viewDocuments(id: string) {
    this.router.navigate(['/cases/documents', id]);
  }

  showSuccessMessage(key: string) {
    const message = this.translate.instant(key);
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage() {
    const message = this.translate.instant('COMMON.ERROR_OCCURRED');
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
