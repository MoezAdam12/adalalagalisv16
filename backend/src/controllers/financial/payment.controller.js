// controllers/financial/payment.controller.js

const Payment = require('../../models/financial/payment.model');
const PaymentApplication = require('../../models/financial/payment-application.model');
const Invoice = require('../../models/financial/invoice.model');
const Client = require('../../models/client.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');
const mongoose = require('mongoose');

/**
 * Payment Controller
 * Handles operations related to payments
 */
const PaymentController = {
  /**
   * Create a new payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createPayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { tenant_id } = req.user;
      const { invoice_applications, ...paymentData } = req.body;
      
      // Validate client exists
      const client = await Client.findOne({ _id: paymentData.client_id, tenant_id });
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }
      
      // Create new payment
      const payment = new Payment({
        ...paymentData,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await payment.save({ session });
      
      // Apply payment to invoices if provided
      if (invoice_applications && Array.isArray(invoice_applications) && invoice_applications.length > 0) {
        await payment.applyToInvoices(invoice_applications, req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete payment with applications
      const completePayment = await Payment.findById(payment._id)
        .populate('applications')
        .populate('client_id', 'name email phone');
      
      // Populate invoice information for applications
      await Payment.populate(completePayment, {
        path: 'applications.invoice_id',
        select: 'invoice_number invoice_date total_amount balance_due'
      });
      
      res.status(201).json({
        success: true,
        data: completePayment
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Get all payments for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPayments: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        client_id,
        payment_method,
        start_date,
        end_date,
        search,
        page = 1,
        limit = 10,
        sort_by = 'payment_date',
        sort_order = 'desc'
      } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by client if provided
      if (client_id) {
        query.client_id = client_id;
      }
      
      // Filter by payment method if provided
      if (payment_method) {
        query.payment_method = payment_method;
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.payment_date = {};
        if (start_date) {
          query.payment_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.payment_date.$lte = new Date(end_date);
        }
      }
      
      // Search by payment number or reference number if provided
      if (search) {
        query.$or = [
          { payment_number: { $regex: search, $options: 'i' } },
          { reference_number: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await Payment.countDocuments(query);
      
      // Get payments
      const payments = await Payment.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('client_id', 'name email phone');
      
      res.status(200).json({
        success: true,
        count: payments.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: payments
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single payment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment ID format'
        });
      }
      
      // Find payment
      const payment = await Payment.findOne({ _id: id, tenant_id })
        .populate('applications')
        .populate('client_id', 'name email phone address')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      // Populate invoice information for applications
      await Payment.populate(payment, {
        path: 'applications.invoice_id',
        select: 'invoice_number invoice_date total_amount balance_due'
      });
      
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Apply payment to invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  applyPayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { invoice_applications } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment ID format'
        });
      }
      
      // Validate invoice applications
      if (!invoice_applications || !Array.isArray(invoice_applications) || invoice_applications.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invoice applications are required'
        });
      }
      
      // Find payment
      const payment = await Payment.findOne({ _id: id, tenant_id });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      // Get current applications
      const currentApplications = await PaymentApplication.find({ payment_id: id });
      const currentTotal = currentApplications.reduce((sum, app) => sum + app.amount, 0);
      
      // Calculate new applications total
      const newTotal = invoice_applications.reduce((sum, app) => sum + app.amount, 0);
      
      // Check if total exceeds payment amount
      if (currentTotal + newTotal > payment.amount) {
        return res.status(400).json({
          success: false,
          error: 'Total application amount exceeds payment amount'
        });
      }
      
      // Apply payment to invoices
      for (const application of invoice_applications) {
        const invoice = await Invoice.findOne({ _id: application.invoice_id, tenant_id });
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: `Invoice with ID ${application.invoice_id} not found`
          });
        }
        
        if (application.amount <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Application amount must be greater than zero'
          });
        }
        
        if (application.amount > invoice.balance_due) {
          return res.status(400).json({
            success: false,
            error: `Application amount ${application.amount} exceeds invoice balance due ${invoice.balance_due}`
          });
        }
        
        // Check if payment is already applied to this invoice
        const existingApplication = await PaymentApplication.findOne({
          payment_id: id,
          invoice_id: application.invoice_id
        });
        
        if (existingApplication) {
          return res.status(400).json({
            success: false,
            error: `Payment is already applied to invoice ${invoice.invoice_number}`
          });
        }
        
        // Create payment application
        const paymentApplication = new PaymentApplication({
          payment_id: id,
          invoice_id: application.invoice_id,
          amount: application.amount
        });
        
        await paymentApplication.save({ session });
        
        // Update invoice
        await invoice.recordPayment(application.amount, req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the updated payment
      const updatedPayment = await Payment.findById(id)
        .populate('applications')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      // Populate invoice information for applications
      await Payment.populate(updatedPayment, {
        path: 'applications.invoice_id',
        select: 'invoice_number invoice_date total_amount balance_due'
      });
      
      res.status(200).json({
        success: true,
        data: updatedPayment
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Delete a payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deletePayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment ID format'
        });
      }
      
      // Find payment
      const payment = await Payment.findOne({ _id: id, tenant_id });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      // Check if payment has applications
      const applications = await PaymentApplication.find({ payment_id: id });
      
      if (applications.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete payment with applications. Remove applications first.'
        });
      }
      
      // Delete payment
      await Payment.findByIdAndDelete(id, { session });
      
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
   * Remove payment application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeApplication: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id, application_id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object IDs
      if (!validateObjectId(id) || !validateObjectId(application_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID format'
        });
      }
      
      // Find payment
      const payment = await Payment.findOne({ _id: id, tenant_id });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      // Find application
      const application = await PaymentApplication.findOne({
        _id: application_id,
        payment_id: id
      });
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Payment application not found'
        });
      }
      
      // Find invoice
      const invoice = await Invoice.findById(application.invoice_id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Update invoice balance
      invoice.amount_paid -= application.amount;
      invoice.balance_due += application.amount;
      
      // Update invoice status
      if (invoice.balance_due >= invoice.total_amount) {
        if (invoice.status === 'sent') {
          invoice.status = 'sent';
        } else {
          invoice.status = 'overdue';
        }
      } else if (invoice.balance_due > 0) {
        invoice.status = 'partially_paid';
      }
      
      await invoice.save({ session });
      
      // Delete application
      await PaymentApplication.findByIdAndDelete(application_id, { session });
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the updated payment
      const updatedPayment = await Payment.findById(id)
        .populate('applications')
        .populate('client_id', 'name email phone')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      // Populate invoice information for applications
      await Payment.populate(updatedPayment, {
        path: 'applications.invoice_id',
        select: 'invoice_number invoice_date total_amount balance_due'
      });
      
      res.status(200).json({
        success: true,
        data: updatedPayment
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  }
};

module.exports = PaymentController;
