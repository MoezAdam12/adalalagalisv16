// frontend/src/app/features/financial/financial.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

// Components
import { FinancialDashboardComponent } from './components/financial-dashboard/financial-dashboard.component';
import { AccountListComponent } from './components/accounts/account-list/account-list.component';
import { AccountFormComponent } from './components/accounts/account-form/account-form.component';
import { AccountDetailComponent } from './components/accounts/account-detail/account-detail.component';
import { JournalEntryListComponent } from './components/journal-entries/journal-entry-list/journal-entry-list.component';
import { JournalEntryFormComponent } from './components/journal-entries/journal-entry-form/journal-entry-form.component';
import { JournalEntryDetailComponent } from './components/journal-entries/journal-entry-detail/journal-entry-detail.component';
import { InvoiceListComponent } from './components/invoices/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoices/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './components/invoices/invoice-detail/invoice-detail.component';
import { PaymentListComponent } from './components/payments/payment-list/payment-list.component';
import { PaymentFormComponent } from './components/payments/payment-form/payment-form.component';
import { PaymentDetailComponent } from './components/payments/payment-detail/payment-detail.component';
import { ExpenseListComponent } from './components/expenses/expense-list/expense-list.component';
import { ExpenseFormComponent } from './components/expenses/expense-form/expense-form.component';
import { ExpenseDetailComponent } from './components/expenses/expense-detail/expense-detail.component';
import { ExpenseCategoryListComponent } from './components/expense-categories/expense-category-list/expense-category-list.component';
import { ExpenseCategoryFormComponent } from './components/expense-categories/expense-category-form/expense-category-form.component';
import { FinancialReportsComponent } from './components/reports/financial-reports/financial-reports.component';

// Services
import { AccountService } from './services/account.service';
import { JournalEntryService } from './services/journal-entry.service';
import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { ExpenseService } from './services/expense.service';
import { ExpenseCategoryService } from './services/expense-category.service';
import { FinancialReportService } from './services/financial-report.service';

// Guards
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'financial',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: FinancialDashboardComponent },
      { path: 'accounts', component: AccountListComponent },
      { path: 'accounts/new', component: AccountFormComponent },
      { path: 'accounts/:id', component: AccountDetailComponent },
      { path: 'accounts/:id/edit', component: AccountFormComponent },
      { path: 'journal-entries', component: JournalEntryListComponent },
      { path: 'journal-entries/new', component: JournalEntryFormComponent },
      { path: 'journal-entries/:id', component: JournalEntryDetailComponent },
      { path: 'journal-entries/:id/edit', component: JournalEntryFormComponent },
      { path: 'invoices', component: InvoiceListComponent },
      { path: 'invoices/new', component: InvoiceFormComponent },
      { path: 'invoices/:id', component: InvoiceDetailComponent },
      { path: 'invoices/:id/edit', component: InvoiceFormComponent },
      { path: 'payments', component: PaymentListComponent },
      { path: 'payments/new', component: PaymentFormComponent },
      { path: 'payments/:id', component: PaymentDetailComponent },
      { path: 'expenses', component: ExpenseListComponent },
      { path: 'expenses/new', component: ExpenseFormComponent },
      { path: 'expenses/:id', component: ExpenseDetailComponent },
      { path: 'expenses/:id/edit', component: ExpenseFormComponent },
      { path: 'expense-categories', component: ExpenseCategoryListComponent },
      { path: 'expense-categories/new', component: ExpenseCategoryFormComponent },
      { path: 'reports', component: FinancialReportsComponent }
    ]
  }
];

@NgModule({
  declarations: [
    FinancialDashboardComponent,
    AccountListComponent,
    AccountFormComponent,
    AccountDetailComponent,
    JournalEntryListComponent,
    JournalEntryFormComponent,
    JournalEntryDetailComponent,
    InvoiceListComponent,
    InvoiceFormComponent,
    InvoiceDetailComponent,
    PaymentListComponent,
    PaymentFormComponent,
    PaymentDetailComponent,
    ExpenseListComponent,
    ExpenseFormComponent,
    ExpenseDetailComponent,
    ExpenseCategoryListComponent,
    ExpenseCategoryFormComponent,
    FinancialReportsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  providers: [
    AccountService,
    JournalEntryService,
    InvoiceService,
    PaymentService,
    ExpenseService,
    ExpenseCategoryService,
    FinancialReportService
  ]
})
export class FinancialModule { }
