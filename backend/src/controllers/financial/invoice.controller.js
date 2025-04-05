// controllers/financial/invoice.controller.js

const Invoice = require('../../models/financial/invoice.model');
const InvoiceItem = require('../../models/financial/invoice-item.model');
const Client = require('../../models/client.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');
const mongoose = require('mongoose');

/**
 * Invoice Controller
 * Handles operations related to invoices
 */
const InvoiceController = {
  /**
   * Create a new invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createInvoice: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { tenant_id } = req.user;
      const { items, ...invoiceData } = req.body;
      
      // Validate client exists
      const client = await Client.findOne({ _id: invoiceData.client_id, tenant_id });
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }
      
      // Validate items array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invoice must have at least one item'
        });
      }
      
      // Create new invoice
      const invoice = new Invoice({
        ...invoiceData,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await invoice.save({ session });
      
      // Create invoice items
      const itemsToSave = items.map(item => ({
        ...item,
        invoice_id: invoice._id
      }));
      
      await InvoiceItem.insertMany(itemsToSave, { session });
      
      // If status is 'sent', send the invoice
      if (invoiceData.status === 'sent') {
        await invoice.send(req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete invoice with items
      const completeInvoice = await Invoice.findById(invoice._id)
        .populate('items')
        .populate('client_id', 'name email phone');
      
      res.status(201).json({
        success: true,
        data: completeInvoice
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Get all invoices for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getInvoices: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        status,
        client_id,
        start_date,
        end_date,
        search,
        page = 1,
        limit = 10,
        sort_by = 'invoice_date',
        sort_order = 'desc'
      } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by status if provided
      if (status) {
        query.status = status;
      }
      
      // Filter by client if provided
      if (client_id) {
        query.client_id = client_id;
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.invoice_date = {};
        if (start_date) {
          query.invoice_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.invoice_date.$lte = new Date(end_date);
        }
      }
      
      // Search by invoice number if provided
      if (search) {
        query.invoice_number = { $regex: search, $options: 'i' };
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await Invoice.countDocuments(query);
      
      // Get invoices
      const invoices = await Invoice.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('client_id', 'name email phone');
      
      res.status(200).json({
        success: true,
        count: invoices.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: invoices
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single invoice by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id })
        .populate('items')
        .populate('client_id', 'name email phone address')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .populate('payments');
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateInvoice: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { items, ...invoiceData } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Only draft invoices can be updated
      if (invoice.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft invoices can be updated'
        });
      }
      
      // Update invoice
      const updateData = {
        ...invoiceData,
        updated_by: req.user._id
      };
      
      Object.assign(invoice, updateData);
      await invoice.save({ session });
      
      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await InvoiceItem.deleteMany({ invoice_id: id }, { session });
        
        // Create new items
        const itemsToSave = items.map(item => ({
          ...item,
          invoice_id: invoice._id
        }));
        
        await InvoiceItem.insertMany(itemsToSave, { session });
      }
      
      // If status is changed to 'sent', send the invoice
      if (invoiceData.status === 'sent' && invoice.status === 'draft') {
        await invoice.send(req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete invoice with items
      const completeInvoice = await Invoice.findById(invoice._id)
        .populate('items')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: completeInvoice
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Delete an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteInvoice: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Only draft invoices can be deleted
      if (invoice.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft invoices can be deleted'
        });
      }
      
      // Delete invoice items
      await InvoiceItem.deleteMany({ invoice_id: id }, { session });
      
      // Delete invoice
      await Invoice.findByIdAndDelete(id, { session });
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Send an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Send the invoice
      await invoice.send(req.user._id);
      
      // Fetch the updated invoice
      const updatedInvoice = await Invoice.findById(id)
        .populate('items')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedInvoice
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Record payment for an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  recordPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { amount } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Payment amount must be greater than zero'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Record payment
      await invoice.recordPayment(amount, req.user._id);
      
      // Fetch the updated invoice
      const updatedInvoice = await Invoice.findById(id)
        .populate('items')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email')
        .populate('payments');
      
      res.status(200).json({
        success: true,
        data: updatedInvoice
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Cancel an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  cancelInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { reason } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
      }
      
      // Validate reason
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Cancellation reason is required'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findOne({ _id: id, tenant_id });
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Cancel the invoice
      await invoice.cancel(reason, req.user._id);
      
      // Fetch the updated invoice
      const updatedInvoice = await Invoice.findById(id)
        .populate('items')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedInvoice
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = InvoiceController;
