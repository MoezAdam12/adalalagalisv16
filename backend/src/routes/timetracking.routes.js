// routes/timetracking.routes.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TimeEntryController = require('../controllers/timetracking/time-entry.controller');
const ActivityTypeController = require('../controllers/timetracking/activity-type.controller');
const BillingRateController = require('../controllers/timetracking/billing-rate.controller');
const TimeTargetController = require('../controllers/timetracking/time-target.controller');

// Time Entry Routes
router.post('/time-entries', authenticate, TimeEntryController.createTimeEntry);
router.get('/time-entries', authenticate, TimeEntryController.getTimeEntries);
router.get('/time-entries/:id', authenticate, TimeEntryController.getTimeEntry);
router.put('/time-entries/:id', authenticate, TimeEntryController.updateTimeEntry);
router.delete('/time-entries/:id', authenticate, TimeEntryController.deleteTimeEntry);
router.get('/time-entries-summary', authenticate, TimeEntryController.getTimeEntriesSummary);

// Activity Type Routes
router.post('/activity-types', authenticate, ActivityTypeController.createActivityType);
router.get('/activity-types', authenticate, ActivityTypeController.getActivityTypes);
router.get('/activity-types/:id', authenticate, ActivityTypeController.getActivityType);
router.put('/activity-types/:id', authenticate, ActivityTypeController.updateActivityType);
router.delete('/activity-types/:id', authenticate, ActivityTypeController.deleteActivityType);

// Billing Rate Routes
router.post('/billing-rates', authenticate, BillingRateController.createBillingRate);
router.get('/billing-rates', authenticate, BillingRateController.getBillingRates);
router.get('/billing-rates/:id', authenticate, BillingRateController.getBillingRate);
router.put('/billing-rates/:id', authenticate, BillingRateController.updateBillingRate);
router.delete('/billing-rates/:id', authenticate, BillingRateController.deleteBillingRate);
router.get('/applicable-rate', authenticate, BillingRateController.findApplicableRate);

// Time Target Routes
router.post('/time-targets', authenticate, TimeTargetController.createTimeTarget);
router.post('/time-targets/monthly', authenticate, TimeTargetController.createMonthlyTargets);
router.get('/time-targets', authenticate, TimeTargetController.getTimeTargets);
router.get('/time-targets/:id', authenticate, TimeTargetController.getTimeTarget);
router.put('/time-targets/:id', authenticate, TimeTargetController.updateTimeTarget);
router.delete('/time-targets/:id', authenticate, TimeTargetController.deleteTimeTarget);
router.get('/time-targets/:id/progress', authenticate, TimeTargetController.getTimeTargetProgress);
router.get('/active-time-target', authenticate, TimeTargetController.getActiveTimeTarget);

module.exports = router;
