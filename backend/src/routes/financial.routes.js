// routes/financial.routes.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Import controllers
const accountController = require('../controllers/financial/account.controller');
const journalEntryController = require('../controllers/financial/journal-entry.controller');
const invoiceController = require('../controllers/financial/invoice.controller');
const paymentController = require('../controllers/financial/payment.controller');
const expenseController = require('../controllers/financial/expense.controller');
const expenseCategoryController = require('../controllers/financial/expense-category.controller');

// Account routes
router.post('/accounts', authenticate, accountController.createAccount);
router.get('/accounts', authenticate, accountController.getAccounts);
router.get('/accounts/chart', authenticate, accountController.getChartOfAccounts);
router.get('/accounts/:id', authenticate, accountController.getAccount);
router.put('/accounts/:id', authenticate, accountController.updateAccount);
router.delete('/accounts/:id', authenticate, accountController.deleteAccount);
router.get('/accounts/:id/balance', authenticate, accountController.getAccountBalance);

// Journal Entry routes
router.post('/journal-entries', authenticate, journalEntryController.createJournalEntry);
router.get('/journal-entries', authenticate, journalEntryController.getJournalEntries);
router.get('/journal-entries/:id', authenticate, journalEntryController.getJournalEntry);
router.put('/journal-entries/:id', authenticate, journalEntryController.updateJournalEntry);
router.delete('/journal-entries/:id', authenticate, journalEntryController.deleteJournalEntry);
router.post('/journal-entries/:id/post', authenticate, journalEntryController.postJournalEntry);
router.post('/journal-entries/:id/void', authenticate, journalEntryController.voidJournalEntry);

// Invoice routes
router.post('/invoices', authenticate, invoiceController.createInvoice);
router.get('/invoices', authenticate, invoiceController.getInvoices);
router.get('/invoices/:id', authenticate, invoiceController.getInvoice);
router.put('/invoices/:id', authenticate, invoiceController.updateInvoice);
router.delete('/invoices/:id', authenticate, invoiceController.deleteInvoice);
router.post('/invoices/:id/send', authenticate, invoiceController.sendInvoice);
router.post('/invoices/:id/payment', authenticate, invoiceController.recordPayment);
router.post('/invoices/:id/cancel', authenticate, invoiceController.cancelInvoice);

// Payment routes
router.post('/payments', authenticate, paymentController.createPayment);
router.get('/payments', authenticate, paymentController.getPayments);
router.get('/payments/:id', authenticate, paymentController.getPayment);
router.post('/payments/:id/apply', authenticate, paymentController.applyPayment);
router.delete('/payments/:id', authenticate, paymentController.deletePayment);
router.delete('/payments/:id/applications/:application_id', authenticate, paymentController.removeApplication);

// Expense routes
router.post('/expenses', authenticate, expenseController.createExpense);
router.get('/expenses', authenticate, expenseController.getExpenses);
router.get('/expenses/:id', authenticate, expenseController.getExpense);
router.put('/expenses/:id', authenticate, expenseController.updateExpense);
router.delete('/expenses/:id', authenticate, expenseController.deleteExpense);
router.post('/expenses/:id/approve', authenticate, expenseController.approveExpense);
router.post('/expenses/:id/reject', authenticate, expenseController.rejectExpense);
router.post('/expenses/:id/mark-paid', authenticate, expenseController.markAsPaid);

// Expense Category routes
router.post('/expense-categories', authenticate, expenseCategoryController.createExpenseCategory);
router.get('/expense-categories', authenticate, expenseCategoryController.getExpenseCategories);
router.get('/expense-categories/:id', authenticate, expenseCategoryController.getExpenseCategory);
router.put('/expense-categories/:id', authenticate, expenseCategoryController.updateExpenseCategory);
router.delete('/expense-categories/:id', authenticate, expenseCategoryController.deleteExpenseCategory);

module.exports = router;
