import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ContractsService } from '../../services/contracts.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-contracts-list',
  templateUrl: './contracts-list.component.html',
  styleUrls: ['./contracts-list.component.scss']
})
export class ContractsListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'client', 'status', 'startDate', 'endDate', 'value', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private contractsService: ContractsService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadContracts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadContracts() {
    this.isLoading = true;
    this.contractsService.getContracts().subscribe({
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

  viewContract(id: string) {
    this.router.navigate(['/contracts/details', id]);
  }

  editContract(id: string) {
    this.router.navigate(['/contracts/edit', id]);
  }

  deleteContract(id: string) {
    const confirmMessage = this.translate.instant('CONTRACTS.DELETE_CONFIRM');
    if (confirm(confirmMessage)) {
      this.contractsService.deleteContract(id).subscribe({
        next: () => {
          this.loadContracts();
          this.showSuccessMessage('CONTRACTS.DELETE_SUCCESS');
        },
        error: (error) => {
          this.error = error.message;
          this.showErrorMessage();
        }
      });
    }
  }

  createNewContract() {
    this.router.navigate(['/contracts/new']);
  }

  viewTemplates() {
    this.router.navigate(['/contracts/templates']);
  }

  viewPayments() {
    this.router.navigate(['/contracts/payments']);
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
