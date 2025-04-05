/**
 * API service with caching and performance optimizations
 */
const axios = require('axios');
const { MemoryCache, debounce, throttle } = require('./performance.utils');

// Create a cache for API requests
const apiCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
});

class ApiService {
  constructor(baseURL, options = {}) {
    this.client = axios.create({
      baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(config => {
      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        // Handle specific error cases
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 401) {
            // Unauthorized - redirect to login
            window.location.href = '/login';
          }
        } else if (error.request) {
          // Request made but no response received
          console.error('Network error, no response received');
        } else {
          // Error in setting up the request
          console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
      }
    );
    
    // Create debounced and throttled versions of methods
    this.debouncedGet = debounce(this.get.bind(this), 300);
    this.throttledGet = throttle(this.get.bind(this), 300);
  }
  
  /**
   * Make a GET request with caching
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async get(url, params = {}, options = {}) {
    const cacheKey = options.cacheKey || `${url}:${JSON.stringify(params)}`;
    const skipCache = options.skipCache || false;
    
    // Try to get from cache first
    if (!skipCache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData !== undefined) {
        return cachedData;
      }
    }
    
    // Make the request
    try {
      const response = await this.client.get(url, { params });
      
      // Cache the response if caching is enabled
      if (!skipCache) {
        apiCache.set(cacheKey, response.data, options.ttl);
      }
      
      return response.data;
    } catch (error) {
      // Log and rethrow
      console.error(`API GET error for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async post(url, data = {}, options = {}) {
    try {
      const response = await this.client.post(url, data);
      
      // Invalidate cache for related resources
      if (options.invalidateCache) {
        this.invalidateCache(options.invalidateCache);
      }
      
      return response.data;
    } catch (error) {
      console.error(`API POST error for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Make a PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async put(url, data = {}, options = {}) {
    try {
      const response = await this.client.put(url, data);
      
      // Invalidate cache for related resources
      if (options.invalidateCache) {
        this.invalidateCache(options.invalidateCache);
      }
      
      return response.data;
    } catch (error) {
      console.error(`API PUT error for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async delete(url, options = {}) {
    try {
      const response = await this.client.delete(url);
      
      // Invalidate cache for related resources
      if (options.invalidateCache) {
        this.invalidateCache(options.invalidateCache);
      }
      
      return response.data;
    } catch (error) {
      console.error(`API DELETE error for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Invalidate cache entries that match a pattern
   * @param {string|Array} patterns - Pattern(s) to match cache keys
   */
  invalidateCache(patterns) {
    if (!patterns) return;
    
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    
    patternArray.forEach(pattern => {
      // Convert pattern to regex
      const regex = new RegExp(pattern.replace('*', '.*'));
      
      // Get all keys and delete matching ones
      for (const key of apiCache.cache.keys()) {
        if (regex.test(key)) {
          apiCache.delete(key);
        }
      }
    });
  }
  
  /**
   * Clear entire cache
   */
  clearCache() {
    apiCache.clear();
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return apiCache.getStats();
  }
}

module.exports = ApiService;
