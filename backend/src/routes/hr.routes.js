// routes/hr.routes.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const EmployeeController = require('../controllers/hr/employee.controller');
const LeaveController = require('../controllers/hr/leave.controller');
const SalaryController = require('../controllers/hr/salary.controller');
const { check } = require('express-validator');

// Employee Routes
router.post('/employees', authenticate, [
  check('first_name').notEmpty().withMessage('First name is required'),
  check('last_name').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('hire_date').isISO8601().withMessage('Valid hire date is required'),
  check('job_title').notEmpty().withMessage('Job title is required')
], EmployeeController.createEmployee);

router.get('/employees', authenticate, EmployeeController.getEmployees);
router.get('/employees/:id', authenticate, EmployeeController.getEmployee);
router.put('/employees/:id', authenticate, [
  check('email').optional().isEmail().withMessage('Valid email is required')
], EmployeeController.updateEmployee);
router.delete('/employees/:id', authenticate, EmployeeController.deleteEmployee);
router.get('/employees/:id/dashboard', authenticate, EmployeeController.getEmployeeDashboard);
router.get('/employees/department/:department', authenticate, EmployeeController.getEmployeesByDepartment);
router.get('/employees/manager/:managerId', authenticate, EmployeeController.getEmployeesByManager);
router.get('/employees/contracts-ending-soon', authenticate, EmployeeController.getEmployeesWithContractsEndingSoon);
router.get('/employees/search', authenticate, EmployeeController.searchEmployees);

// Leave Routes
router.post('/leaves', authenticate, [
  check('employee_id').notEmpty().withMessage('Employee ID is required'),
  check('leave_type').notEmpty().withMessage('Leave type is required'),
  check('start_date').isISO8601().withMessage('Valid start date is required'),
  check('end_date').isISO8601().withMessage('Valid end date is required'),
  check('days').isNumeric().withMessage('Days must be a number')
], LeaveController.createLeave);

router.get('/leaves', authenticate, LeaveController.getLeaves);
router.get('/leaves/:id', authenticate, LeaveController.getLeave);
router.put('/leaves/:id', authenticate, LeaveController.updateLeave);
router.delete('/leaves/:id', authenticate, LeaveController.deleteLeave);
router.get('/leaves/employee/:employeeId', authenticate, LeaveController.getLeavesByEmployee);
router.get('/leaves/status/:status', authenticate, LeaveController.getLeavesByStatus);
router.get('/leaves/current-and-upcoming', authenticate, LeaveController.getCurrentAndUpcomingLeaves);
router.post('/leaves/:id/approve', authenticate, LeaveController.approveLeave);
router.post('/leaves/:id/reject', authenticate, LeaveController.rejectLeave);

// Salary Routes
router.post('/salaries', authenticate, [
  check('employee_id').notEmpty().withMessage('Employee ID is required'),
  check('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  check('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
  check('base_salary').isNumeric().withMessage('Base salary must be a number')
], SalaryController.createSalary);

router.get('/salaries', authenticate, SalaryController.getSalaries);
router.get('/salaries/:id', authenticate, SalaryController.getSalary);
router.put('/salaries/:id', authenticate, SalaryController.updateSalary);
router.delete('/salaries/:id', authenticate, SalaryController.deleteSalary);
router.get('/salaries/employee/:employeeId', authenticate, SalaryController.getSalariesByEmployee);
router.get('/salaries/month-year/:month/:year', authenticate, SalaryController.getSalariesByMonthYear);
router.get('/salaries/pending', authenticate, SalaryController.getPendingSalaries);
router.post('/salaries/generate-monthly', authenticate, [
  check('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  check('year').isInt({ min: 2000 }).withMessage('Valid year is required')
], SalaryController.generateMonthlySalaries);
router.post('/salaries/process-payments', authenticate, [
  check('salaryIds').isArray().withMessage('Salary IDs must be an array')
], SalaryController.processSalaryPayments);

module.exports = router;
