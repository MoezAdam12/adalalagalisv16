/**
 * Performance utilities for caching and optimization
 */

/**
 * Simple in-memory cache implementation
 */
class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 60 * 1000; // Default TTL: 60 seconds
    this.maxSize = options.maxSize || 100; // Default max size: 100 items
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined if not found or expired
   */
  get(key) {
    if (!key) return undefined;
    
    const item = this.cache.get(key);
    
    // Check if item exists and is not expired
    if (item && item.expiry > Date.now()) {
      this.hits++;
      return item.value;
    }
    
    // Item doesn't exist or is expired
    if (item) {
      this.cache.delete(key);
    }
    
    this.misses++;
    return undefined;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  set(key, value, ttl) {
    if (!key) return;
    
    // Ensure we don't exceed max size by removing oldest items if needed
    if (this.cache.size >= this.maxSize) {
      const keysIterator = this.cache.keys();
      this.cache.delete(keysIterator.next().value);
    }
    
    const expiry = Date.now() + (ttl || this.ttl);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete item from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (!key) return;
    this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0
    };
  }
}

/**
 * Memoize a function (cache its results)
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Cache options
 * @returns {Function} Memoized function
 */
function memoize(fn, options = {}) {
  const cache = new MemoryCache(options);
  
  return function(...args) {
    const key = JSON.stringify(args);
    const cachedResult = cache.get(key);
    
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Debounce a function (limit how often it can be called)
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, wait = 300) {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      fn.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle a function (limit how often it can be called)
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(fn, limit = 300) {
  let inThrottle = false;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      fn.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Batch multiple requests into a single request
 * @param {Function} fn - Function to batch
 * @param {Object} options - Batch options
 * @returns {Function} Batched function
 */
function batchRequests(fn, options = {}) {
  const { delay = 50, maxBatchSize = 100 } = options;
  let batch = [];
  let timer = null;
  
  const processBatch = async () => {
    const currentBatch = [...batch];
    batch = [];
    timer = null;
    
    try {
      const results = await fn(currentBatch);
      
      // Resolve each promise in the batch with its corresponding result
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in the batch
      currentBatch.forEach(item => {
        item.reject(error);
      });
    }
  };
  
  return function(item) {
    return new Promise((resolve, reject) => {
      batch.push({ item, resolve, reject });
      
      if (batch.length >= maxBatchSize) {
        // Process immediately if batch is full
        clearTimeout(timer);
        processBatch();
      } else if (!timer) {
        // Set timer to process batch after delay
        timer = setTimeout(processBatch, delay);
      }
    });
  };
}

/**
 * Lazy load images
 * @param {string} selector - CSS selector for images to lazy load
 */
function lazyLoadImages(selector = 'img[data-src]') {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        
        if (src) {
          img.setAttribute('src', src);
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });
  
  document.querySelectorAll(selector).forEach(img => {
    observer.observe(img);
  });
}

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {Array} args - Arguments to pass to the function
 * @returns {Object} Result and execution time
 */
async function measureExecutionTime(fn, ...args) {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  
  return {
    result,
    executionTime: end - start
  };
}

module.exports = {
  MemoryCache,
  memoize,
  debounce,
  throttle,
  batchRequests,
  lazyLoadImages,
  measureExecutionTime
};
