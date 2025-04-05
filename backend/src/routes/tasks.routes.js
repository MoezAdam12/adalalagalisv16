const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { validateTask } = require('../middleware/validators/task.validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all tasks for current tenant
router.get('/', tasksController.getAllTasks);

// Get task by ID
router.get('/:id', tasksController.getTaskById);

// Create new task
router.post('/', validateTask, tasksController.createTask);

// Update task
router.put('/:id', validateTask, tasksController.updateTask);

// Delete task
router.delete('/:id', tasksController.deleteTask);

// Assign task to user
router.post('/:id/assign/:userId', tasksController.assignTask);

// Change task status
router.put('/:id/status', tasksController.changeTaskStatus);

// Add task comment
router.post('/:id/comments', tasksController.addTaskComment);

// Get task comments
router.get('/:id/comments', tasksController.getTaskComments);

// Get tasks by workflow
router.get('/workflow/:workflowId', tasksController.getTasksByWorkflow);

// Get tasks by assignee
router.get('/assignee/:userId', tasksController.getTasksByAssignee);

// Get task categories
router.get('/categories', tasksController.getTaskCategories);

// Create task category
router.post('/categories', authorize(['admin', 'manager']), tasksController.createTaskCategory);

// Get task priorities
router.get('/priorities', tasksController.getTaskPriorities);

// Get task statuses
router.get('/statuses', tasksController.getTaskStatuses);

module.exports = router;
