/**
 * وسيط تحسين استعلامات قاعدة البيانات
 * يوفر وظائف لتحسين أداء استعلامات قاعدة البيانات
 */

const { Op } = require('sequelize');
const envConfig = require('../config/env.config');

/**
 * تحسين استعلام Sequelize
 * @param {Object} options خيارات الاستعلام
 * @param {Array} fields الحقول المطلوبة (اختياري)
 * @param {String} indexHint تلميح الفهرس (اختياري)
 * @returns {Object} خيارات الاستعلام المحسنة
 */
const optimizeQuery = (options = {}, fields = null, indexHint = null) => {
  const optimizedOptions = { ...options };

  // تحديد الحقول المطلوبة فقط إذا تم توفيرها
  if (fields && Array.isArray(fields) && fields.length > 0) {
    optimizedOptions.attributes = fields;
  }

  // إضافة تلميح الفهرس إذا تم توفيره
  if (indexHint) {
    optimizedOptions.indexHints = [
      { type: 'USE', values: [indexHint] }
    ];
  }

  return optimizedOptions;
};

/**
 * تنفيذ استعلام مجمع
 * @param {Model} model نموذج Sequelize
 * @param {Array} ids مصفوفة المعرفات
 * @param {Object} options خيارات الاستعلام (اختياري)
 * @param {Number} batchSize حجم الدفعة (اختياري)
 * @returns {Promise<Array>} وعد بنتائج الاستعلام
 */
const batchQuery = async (model, ids, options = {}, batchSize = 100) => {
  // التحقق من وجود معرفات
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  // تقسيم المعرفات إلى دفعات
  const batches = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }

  // تنفيذ الاستعلامات بالتوازي
  const results = await Promise.all(
    batches.map(batchIds => {
      const batchOptions = {
        ...options,
        where: {
          ...options.where,
          id: { [Op.in]: batchIds }
        }
      };
      return model.findAll(batchOptions);
    })
  );

  // دمج النتائج
  return results.flat();
};

/**
 * تنفيذ استعلام مع تصفح بالمؤشر
 * @param {Model} model نموذج Sequelize
 * @param {Object} options خيارات الاستعلام
 * @param {String} cursorField حقل المؤشر
 * @param {String} cursor قيمة المؤشر (اختياري)
 * @param {Number} limit عدد النتائج (اختياري)
 * @param {Boolean} descending ترتيب تنازلي (اختياري)
 * @returns {Promise<Object>} وعد بنتائج الاستعلام والمؤشر التالي
 */
const cursorPagination = async (
  model,
  options = {},
  cursorField = 'id',
  cursor = null,
  limit = 20,
  descending = false
) => {
  // نسخ خيارات الاستعلام
  const queryOptions = { ...options };
  
  // إضافة شرط المؤشر إذا تم توفيره
  if (cursor) {
    queryOptions.where = queryOptions.where || {};
    const operator = descending ? Op.lt : Op.gt;
    queryOptions.where[cursorField] = { [operator]: cursor };
  }
  
  // إضافة الترتيب
  const order = descending ? 'DESC' : 'ASC';
  queryOptions.order = [[cursorField, order]];
  
  // إضافة الحد
  queryOptions.limit = limit + 1; // طلب عنصر إضافي لتحديد المؤشر التالي
  
  // تنفيذ الاستعلام
  const results = await model.findAll(queryOptions);
  
  // التحقق مما إذا كانت هناك نتائج إضافية
  const hasMore = results.length > limit;
  
  // إزالة العنصر الإضافي إذا كان موجودًا
  const items = hasMore ? results.slice(0, limit) : results;
  
  // تحديد المؤشر التالي
  const nextCursor = hasMore ? items[items.length - 1][cursorField] : null;
  
  return {
    items,
    nextCursor,
    hasMore
  };
};

/**
 * تحسين استعلامات الانضمام
 * @param {Object} options خيارات الاستعلام
 * @param {Array} includes الانضمامات المطلوبة
 * @param {Boolean} separate استخدام استعلامات منفصلة (اختياري)
 * @returns {Object} خيارات الاستعلام المحسنة
 */
const optimizeJoins = (options = {}, includes = [], separate = false) => {
  // نسخ خيارات الاستعلام
  const queryOptions = { ...options };
  
  // إذا كان مطلوبًا استخدام استعلامات منفصلة
  if (separate && includes.length > 0) {
    queryOptions.include = includes.map(include => ({
      ...include,
      separate: true
    }));
  } else {
    queryOptions.include = includes;
  }
  
  return queryOptions;
};

/**
 * تنفيذ استعلام مع تخزين مؤقت
 * @param {Function} queryFn دالة الاستعلام
 * @param {String} cacheKey مفتاح التخزين المؤقت
 * @param {Number} ttl فترة الصلاحية بالثواني (اختياري)
 * @returns {Promise<any>} وعد بنتائج الاستعلام
 */
const cachedQuery = async (queryFn, cacheKey, ttl = 300) => {
  // التحقق من وجود Redis
  if (!envConfig.REDIS_URL || !envConfig.ENABLE_CACHE) {
    // تنفيذ الاستعلام مباشرة إذا كان التخزين المؤقت معطلاً
    return queryFn();
  }
  
  try {
    // الحصول على عميل Redis
    const redis = require('redis');
    const { promisify } = require('util');
    
    const client = redis.createClient({
      url: envConfig.REDIS_URL
    });
    
    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    
    // التحقق من وجود النتائج في التخزين المؤقت
    const cachedResult = await getAsync(cacheKey);
    
    if (cachedResult) {
      // إرجاع النتائج المخزنة مؤقتًا
      client.quit();
      return JSON.parse(cachedResult);
    }
    
    // تنفيذ الاستعلام
    const result = await queryFn();
    
    // تخزين النتائج مؤقتًا
    await setAsync(cacheKey, JSON.stringify(result), 'EX', ttl);
    
    client.quit();
    return result;
  } catch (error) {
    console.error('خطأ في استعلام مخزن مؤقتًا:', error);
    // تنفيذ الاستعلام مباشرة في حالة حدوث خطأ
    return queryFn();
  }
};

/**
 * إبطال التخزين المؤقت للاستعلامات
 * @param {String|RegExp} pattern نمط مفتاح التخزين المؤقت
 * @returns {Promise<Number>} وعد بعدد المفاتيح التي تم إبطالها
 */
const invalidateCache = async (pattern) => {
  // التحقق من وجود Redis
  if (!envConfig.REDIS_URL || !envConfig.ENABLE_CACHE) {
    return 0;
  }
  
  try {
    // الحصول على عميل Redis
    const redis = require('redis');
    const { promisify } = require('util');
    
    const client = redis.createClient({
      url: envConfig.REDIS_URL
    });
    
    const keysAsync = promisify(client.keys).bind(client);
    const delAsync = promisify(client.del).bind(client);
    
    // الحصول على المفاتيح التي تطابق النمط
    const keys = await keysAsync(typeof pattern === 'string' ? pattern : '*');
    
    // تصفية المفاتيح إذا كان النمط تعبيرًا منتظمًا
    const matchedKeys = typeof pattern === 'string'
      ? keys
      : keys.filter(key => pattern.test(key));
    
    if (matchedKeys.length === 0) {
      client.quit();
      return 0;
    }
    
    // حذف المفاتيح
    const result = await delAsync(matchedKeys);
    
    client.quit();
    return result;
  } catch (error) {
    console.error('خطأ في إبطال التخزين المؤقت:', error);
    return 0;
  }
};

module.exports = {
  optimizeQuery,
  batchQuery,
  cursorPagination,
  optimizeJoins,
  cachedQuery,
  invalidateCache
};
