/**
 * Database optimization utilities for improving query performance
 */

const { Sequelize, Op } = require('sequelize');
const { MemoryCache } = require('./performance.utils');

// Create a cache for database queries
const queryCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200
});

/**
 * Optimize a Sequelize query by adding proper indexes and limiting fields
 * @param {Object} options - Query options
 * @returns {Object} Optimized query options
 */
function optimizeQuery(options = {}) {
  const optimized = { ...options };
  
  // Only select specific attributes if not already specified
  if (!optimized.attributes && optimized.model) {
    const primaryKeys = Object.keys(optimized.model.primaryKeys || {});
    const importantFields = primaryKeys.concat(['created_at', 'updated_at']);
    
    // Get all attributes from the model
    const allAttributes = Object.keys(optimized.model.rawAttributes || {});
    
    // Filter out large text fields or JSON fields that might not be needed
    const excludedTypes = ['TEXT', 'BLOB', 'JSON', 'JSONB'];
    const attributes = allAttributes.filter(attr => {
      const dataType = optimized.model.rawAttributes[attr]?.type;
      if (!dataType) return true;
      
      const typeName = dataType.key || dataType.constructor.name;
      return !excludedTypes.some(type => typeName.includes(type)) || importantFields.includes(attr);
    });
    
    optimized.attributes = attributes;
  }
  
  // Add proper indexing hints if supported by the dialect
  if (optimized.model && optimized.model.sequelize.options.dialect === 'mysql') {
    optimized.indexHints = optimized.indexHints || [];
    
    // Add USE INDEX hint if we have a where clause
    if (optimized.where && Object.keys(optimized.where).length > 0) {
      const whereFields = Object.keys(optimized.where);
      
      // Find indexes that match our where fields
      const indexes = optimized.model.options.indexes || [];
      const matchingIndexes = indexes.filter(index => 
        index.fields.some(field => whereFields.includes(typeof field === 'string' ? field : field.name))
      );
      
      if (matchingIndexes.length > 0) {
        optimized.indexHints.push({ type: 'USE', values: matchingIndexes.map(index => index.name) });
      }
    }
  }
  
  // Add pagination if not already specified
  if (!optimized.limit && !optimized.id) {
    optimized.limit = 100; // Default limit to prevent large result sets
  }
  
  // Add proper ordering if not specified
  if (!optimized.order && optimized.model && optimized.model.primaryKeys) {
    const primaryKey = Object.keys(optimized.model.primaryKeys)[0];
    if (primaryKey) {
      optimized.order = [[primaryKey, 'ASC']];
    }
  }
  
  return optimized;
}

/**
 * Execute a cached database query
 * @param {Function} queryFn - Function that returns a Sequelize query promise
 * @param {string} cacheKey - Key for caching the result
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise} Query result
 */
async function cachedQuery(queryFn, cacheKey, ttl) {
  if (!cacheKey) {
    return queryFn();
  }
  
  // Try to get from cache first
  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult !== undefined) {
    return cachedResult;
  }
  
  // Execute query and cache result
  const result = await queryFn();
  queryCache.set(cacheKey, result, ttl);
  
  return result;
}

/**
 * Invalidate cache entries that match a pattern
 * @param {string} pattern - Pattern to match cache keys
 */
function invalidateCache(pattern) {
  if (!pattern) return;
  
  // Convert pattern to regex
  const regex = new RegExp(pattern.replace('*', '.*'));
  
  // Get all keys and delete matching ones
  for (const key of queryCache.cache.keys()) {
    if (regex.test(key)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Create optimized pagination for large datasets
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination query parts
 */
function createPagination(options = {}) {
  const { page = 1, pageSize = 20, sortField = 'id', sortOrder = 'ASC' } = options;
  
  // Validate inputs
  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const validatedSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) 
    ? sortOrder.toUpperCase() 
    : 'ASC';
  
  // Calculate offset
  const offset = (validatedPage - 1) * validatedPageSize;
  
  return {
    limit: validatedPageSize,
    offset,
    order: [[sortField, validatedSortOrder]],
    page: validatedPage,
    pageSize: validatedPageSize
  };
}

/**
 * Create a cursor-based pagination for very large datasets
 * @param {Object} options - Pagination options
 * @returns {Object} Cursor pagination query parts
 */
function createCursorPagination(options = {}) {
  const { 
    cursor, 
    pageSize = 20, 
    sortField = 'id', 
    sortOrder = 'ASC',
    cursorField = 'id'
  } = options;
  
  // Validate inputs
  const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const validatedSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) 
    ? sortOrder.toUpperCase() 
    : 'ASC';
  
  // Create where clause based on cursor
  const where = {};
  if (cursor) {
    const operator = validatedSortOrder === 'ASC' ? Op.gt : Op.lt;
    where[cursorField] = { [operator]: cursor };
  }
  
  return {
    where,
    limit: validatedPageSize,
    order: [[sortField, validatedSortOrder]],
    pageSize: validatedPageSize
  };
}

/**
 * Batch database operations for better performance
 * @param {Array} items - Items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Processed results
 */
async function batchDatabaseOperations(items, processFn, options = {}) {
  const { batchSize = 100, concurrency = 5 } = options;
  
  if (!items || !items.length) {
    return [];
  }
  
  // Split items into batches
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  // Process batches with limited concurrency
  const results = [];
  for (let i = 0; i < batches.length; i += concurrency) {
    const batchPromises = batches
      .slice(i, i + concurrency)
      .map(batch => processFn(batch));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  
  return results;
}

/**
 * Create database transaction with proper isolation level
 * @param {Object} sequelize - Sequelize instance
 * @param {Function} callback - Function to execute within transaction
 * @param {Object} options - Transaction options
 * @returns {Promise} Transaction result
 */
async function withTransaction(sequelize, callback, options = {}) {
  const transaction = await sequelize.transaction({
    isolationLevel: options.isolationLevel || Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    ...options
  });
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  optimizeQuery,
  cachedQuery,
  invalidateCache,
  createPagination,
  createCursorPagination,
  batchDatabaseOperations,
  withTransaction,
  queryCache
};
