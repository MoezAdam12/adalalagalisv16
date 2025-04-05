// controllers/financial/journal-entry.controller.js

const JournalEntry = require('../../models/financial/journal-entry.model');
const JournalEntryDetail = require('../../models/financial/journal-entry-detail.model');
const { handleError } = require('../../utils/error-handler');
const { validateObjectId } = require('../../utils/validators');
const mongoose = require('mongoose');

/**
 * Journal Entry Controller
 * Handles operations related to journal entries
 */
const JournalEntryController = {
  /**
   * Create a new journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createJournalEntry: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { tenant_id } = req.user;
      const { details, ...entryData } = req.body;
      
      // Validate details array
      if (!details || !Array.isArray(details) || details.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Journal entry must have at least one detail line'
        });
      }
      
      // Create new journal entry
      const journalEntry = new JournalEntry({
        ...entryData,
        tenant_id,
        created_by: req.user._id,
        updated_by: req.user._id
      });
      
      await journalEntry.save({ session });
      
      // Create journal entry details
      const detailsToSave = details.map(detail => ({
        ...detail,
        entry_id: journalEntry._id
      }));
      
      await JournalEntryDetail.insertMany(detailsToSave, { session });
      
      // Check if entry is balanced
      await journalEntry.populate('details');
      const isBalanced = await journalEntry.isBalanced();
      
      if (!isBalanced) {
        await session.abortTransaction();
        session.endSession();
        
        return res.status(400).json({
          success: false,
          error: 'Journal entry must be balanced (debits must equal credits)'
        });
      }
      
      // If status is 'posted', post the entry
      if (entryData.status === 'posted') {
        await journalEntry.post(req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete entry with details
      const completeEntry = await JournalEntry.findById(journalEntry._id).populate('details');
      
      res.status(201).json({
        success: true,
        data: completeEntry
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Get all journal entries for the tenant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getJournalEntries: async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const {
        status,
        start_date,
        end_date,
        source_document,
        search,
        page = 1,
        limit = 10,
        sort_by = 'entry_date',
        sort_order = 'desc'
      } = req.query;
      
      // Build query
      const query = { tenant_id };
      
      // Filter by status if provided
      if (status) {
        query.status = status;
      }
      
      // Filter by date range if provided
      if (start_date || end_date) {
        query.entry_date = {};
        if (start_date) {
          query.entry_date.$gte = new Date(start_date);
        }
        if (end_date) {
          query.entry_date.$lte = new Date(end_date);
        }
      }
      
      // Filter by source document if provided
      if (source_document) {
        query.source_document = source_document;
      }
      
      // Search by entry number or description if provided
      if (search) {
        query.$or = [
          { entry_number: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await JournalEntry.countDocuments(query);
      
      // Get journal entries
      const journalEntries = await JournalEntry.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('created_by', 'name email');
      
      res.status(200).json({
        success: true,
        count: journalEntries.length,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        data: journalEntries
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Get a single journal entry by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getJournalEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid journal entry ID format'
        });
      }
      
      // Find journal entry
      const journalEntry = await JournalEntry.findOne({ _id: id, tenant_id })
        .populate('details')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }
      
      // Populate account information for details
      await JournalEntry.populate(journalEntry, {
        path: 'details.account_id',
        select: 'account_code account_name account_type'
      });
      
      res.status(200).json({
        success: true,
        data: journalEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Update a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateJournalEntry: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { details, ...entryData } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid journal entry ID format'
        });
      }
      
      // Find journal entry
      const journalEntry = await JournalEntry.findOne({ _id: id, tenant_id });
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }
      
      // Only draft entries can be updated
      if (journalEntry.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft journal entries can be updated'
        });
      }
      
      // Update journal entry
      const updateData = {
        ...entryData,
        updated_by: req.user._id
      };
      
      Object.assign(journalEntry, updateData);
      await journalEntry.save({ session });
      
      // Update details if provided
      if (details && Array.isArray(details)) {
        // Delete existing details
        await JournalEntryDetail.deleteMany({ entry_id: id }, { session });
        
        // Create new details
        const detailsToSave = details.map(detail => ({
          ...detail,
          entry_id: journalEntry._id
        }));
        
        await JournalEntryDetail.insertMany(detailsToSave, { session });
        
        // Check if entry is balanced
        await journalEntry.populate('details');
        const isBalanced = await journalEntry.isBalanced();
        
        if (!isBalanced) {
          await session.abortTransaction();
          session.endSession();
          
          return res.status(400).json({
            success: false,
            error: 'Journal entry must be balanced (debits must equal credits)'
          });
        }
      }
      
      // If status is changed to 'posted', post the entry
      if (entryData.status === 'posted' && journalEntry.status === 'draft') {
        await journalEntry.post(req.user._id);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete entry with details
      const completeEntry = await JournalEntry.findById(journalEntry._id)
        .populate('details')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: completeEntry
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      handleError(res, error);
    }
  },
  
  /**
   * Delete a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteJournalEntry: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid journal entry ID format'
        });
      }
      
      // Find journal entry
      const journalEntry = await JournalEntry.findOne({ _id: id, tenant_id });
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }
      
      // Only draft entries can be deleted
      if (journalEntry.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft journal entries can be deleted'
        });
      }
      
      // Delete journal entry details
      await JournalEntryDetail.deleteMany({ entry_id: id }, { session });
      
      // Delete journal entry
      await JournalEntry.findByIdAndDelete(id, { session });
      
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
   * Post a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  postJournalEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid journal entry ID format'
        });
      }
      
      // Find journal entry
      const journalEntry = await JournalEntry.findOne({ _id: id, tenant_id }).populate('details');
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }
      
      // Only draft entries can be posted
      if (journalEntry.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft journal entries can be posted'
        });
      }
      
      // Post the journal entry
      await journalEntry.post(req.user._id);
      
      // Fetch the updated entry
      const updatedEntry = await JournalEntry.findById(id)
        .populate('details')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  /**
   * Void a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  voidJournalEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { tenant_id } = req.user;
      const { reason } = req.body;
      
      // Validate object ID
      if (!validateObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid journal entry ID format'
        });
      }
      
      // Validate reason
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Void reason is required'
        });
      }
      
      // Find journal entry
      const journalEntry = await JournalEntry.findOne({ _id: id, tenant_id }).populate('details');
      
      if (!journalEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }
      
      // Only posted entries can be voided
      if (journalEntry.status !== 'posted') {
        return res.status(400).json({
          success: false,
          error: 'Only posted journal entries can be voided'
        });
      }
      
      // Void the journal entry
      await journalEntry.void(reason, req.user._id);
      
      // Fetch the updated entry
      const updatedEntry = await JournalEntry.findById(id)
        .populate('details')
        .populate('created_by', 'name email')
        .populate('updated_by', 'name email');
      
      res.status(200).json({
        success: true,
        data: updatedEntry
      });
    } catch (error) {
      handleError(res, error);
    }
  }
};

module.exports = JournalEntryController;
