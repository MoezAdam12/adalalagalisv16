const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documents.controller');
const { validateDocument } = require('../middleware/validators/document.validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all documents for current tenant
router.get('/', documentsController.getAllDocuments);

// Get document by ID
router.get('/:id', documentsController.getDocumentById);

// Create new document with file upload
router.post('/', upload.single('file'), validateDocument, documentsController.createDocument);

// Update document metadata
router.put('/:id', validateDocument, documentsController.updateDocument);

// Update document file
router.put('/:id/file', upload.single('file'), documentsController.updateDocumentFile);

// Delete document
router.delete('/:id', authorize(['admin', 'manager']), documentsController.deleteDocument);

// Get document versions
router.get('/:id/versions', documentsController.getDocumentVersions);

// Get specific document version
router.get('/:id/versions/:versionId', documentsController.getDocumentVersion);

// Download document
router.get('/:id/download', documentsController.downloadDocument);

// Share document (generate shareable link)
router.post('/:id/share', documentsController.shareDocument);

// Get document categories
router.get('/categories', documentsController.getDocumentCategories);

// Create document category
router.post('/categories', authorize(['admin', 'manager']), documentsController.createDocumentCategory);

// Search documents
router.get('/search', documentsController.searchDocuments);

// OCR document
router.post('/:id/ocr', documentsController.ocrDocument);

module.exports = router;
