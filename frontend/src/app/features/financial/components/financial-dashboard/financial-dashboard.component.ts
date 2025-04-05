// frontend/src/app/features/financial/components/financial-dashboard/financial-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { InvoiceService } from '../../services/invoice.service';
import { ExpenseService } from '../../services/expense.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-financial-dashboard',
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.scss']
})
export class FinancialDashboardComponent implements OnInit {
  // Dashboard data
  financialSummary: any = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    cashBalance: 0
  };
  
  // Charts data
  revenueExpenseChart: any = {
    labels: [],
    datasets: []
  };
  
  invoiceStatusChart: any = {
    labels: ['مدفوعة', 'مدفوعة جزئياً', 'غير مدفوعة', 'متأخرة'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#F44336']
    }]
  };
  
  // Recent data
  recentInvoices: any[] = [];
  recentExpenses: any[] = [];
  
  // Loading states
  loading = {
    summary: true,
    charts: true,
    invoices: true,
    expenses: true
  };
  
  // Error states
  error = {
    summary: false,
    charts: false,
    invoices: false,
    expenses: false
  };

  constructor(
    private accountService: AccountService,
    private invoiceService: InvoiceService,
    private expenseService: ExpenseService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load financial summary
    this.loadFinancialSummary();
    
    // Load charts data
    this.loadChartsData();
    
    // Load recent invoices
    this.loadRecentInvoices();
    
    // Load recent expenses
    this.loadRecentExpenses();
  }

  loadFinancialSummary(): void {
    this.loading.summary = true;
    this.error.summary = false;
    
    // Get accounts for summary
    const cashAccount$ = this.accountService.getAccountBalance('cash-account-id');
    const arAccount$ = this.accountService.getAccountBalance('accounts-receivable-id');
    const apAccount$ = this.accountService.getAccountBalance('accounts-payable-id');
    
    forkJoin({
      cash: cashAccount$,
      ar: arAccount$,
      ap: apAccount$
    }).subscribe({
      next: (result) => {
        this.financialSummary.cashBalance = result.cash.data.balance;
        this.financialSummary.accountsReceivable = result.ar.data.balance;
        this.financialSummary.accountsPayable = result.ap.data.balance;
        
        // Calculate net income
        this.financialSummary.netIncome = 
          this.financialSummary.totalRevenue - this.financialSummary.totalExpenses;
        
        this.loading.summary = false;
      },
      error: (err) => {
        console.error('Error loading financial summary:', err);
        this.loading.summary = false;
        this.error.summary = true;
      }
    });
    
    // Get revenue and expense totals for current period
    // This would typically come from an income statement API endpoint
    // For now, we'll use placeholder values
    this.financialSummary.totalRevenue = 250000;
    this.financialSummary.totalExpenses = 180000;
    this.financialSummary.netIncome = 
      this.financialSummary.totalRevenue - this.financialSummary.totalExpenses;
  }

  loadChartsData(): void {
    this.loading.charts = true;
    this.error.charts = false;
    
    // Load revenue/expense chart data
    // This would typically come from an API endpoint with monthly data
    // For now, we'll use placeholder data
    this.revenueExpenseChart = {
      labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
      datasets: [
        {
          label: 'الإيرادات',
          data: [30000, 40000, 35000, 50000, 45000, 50000],
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'المصروفات',
          data: [25000, 30000, 28000, 35000, 32000, 30000],
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderColor: '#F44336',
          borderWidth: 1
        }
      ]
    };
    
    // Load invoice status chart data
    this.invoiceService.getInvoices().subscribe({
      next: (result) => {
        const invoices = result.data;
        let paid = 0;
        let partiallyPaid = 0;
        let unpaid = 0;
        let overdue = 0;
        
        invoices.forEach((invoice: any) => {
          switch (invoice.status) {
            case 'paid':
              paid++;
              break;
            case 'partially_paid':
              partiallyPaid++;
              break;
            case 'sent':
              unpaid++;
              break;
            case 'overdue':
              overdue++;
              break;
          }
        });
        
        this.invoiceStatusChart.datasets[0].data = [paid, partiallyPaid, unpaid, overdue];
        this.loading.charts = false;
      },
      error: (err) => {
        console.error('Error loading invoice status chart:', err);
        this.loading.charts = false;
        this.error.charts = true;
      }
    });
  }

  loadRecentInvoices(): void {
    this.loading.invoices = true;
    this.error.invoices = false;
    
    this.invoiceService.getInvoices({
      limit: 5,
      sort_by: 'invoice_date',
      sort_order: 'desc'
    }).subscribe({
      next: (result) => {
        this.recentInvoices = result.data;
        this.loading.invoices = false;
      },
      error: (err) => {
        console.error('Error loading recent invoices:', err);
        this.loading.invoices = false;
        this.error.invoices = true;
      }
    });
  }

  loadRecentExpenses(): void {
    this.loading.expenses = true;
    this.error.expenses = false;
    
    this.expenseService.getExpenses({
      limit: 5,
      sort_by: 'expense_date',
      sort_order: 'desc'
    }).subscribe({
      next: (result) => {
        this.recentExpenses = result.data;
        this.loading.expenses = false;
      },
      error: (err) => {
        console.error('Error loading recent expenses:', err);
        this.loading.expenses = false;
        this.error.expenses = true;
      }
    });
  }
}
