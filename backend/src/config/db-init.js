const sequelize = require('./database');
const fs = require('fs');
const path = require('path');

/**
 * تهيئة قاعدة البيانات وإنشاء المخططات والجداول
 */
async function initializeDatabase() {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('تم الاتصال بقاعدة البيانات بنجاح.');

    // إنشاء المخططات إذا لم تكن موجودة
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS tenant_management;');
    console.log('تم إنشاء مخطط tenant_management بنجاح أو كان موجوداً بالفعل.');

    // مزامنة النماذج مع قاعدة البيانات
    // يجب استيراد جميع النماذج قبل المزامنة
    const modelsDir = path.join(__dirname, '../models');
    
    // قراءة جميع ملفات النماذج
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.model.js'));
    
    // استيراد جميع النماذج
    for (const file of modelFiles) {
      require(path.join(modelsDir, file));
    }
    
    // مزامنة النماذج مع قاعدة البيانات
    // استخدام { alter: true } في بيئة التطوير للسماح بتعديل الجداول الموجودة
    // استخدام { force: false } لمنع حذف البيانات الموجودة
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false, force: false } 
      : { alter: true, force: false };
    
    await sequelize.sync(syncOptions);
    console.log('تم مزامنة جميع النماذج مع قاعدة البيانات بنجاح.');
    
    // إنشاء بيانات أولية إذا كانت بيئة التطوير
    if (process.env.NODE_ENV !== 'production') {
      await createInitialData();
    }
    
    return true;
  } catch (error) {
    console.error('فشل تهيئة قاعدة البيانات:', error);
    return false;
  }
}

/**
 * إنشاء بيانات أولية للتطوير والاختبار
 */
async function createInitialData() {
  try {
    const { Tenant, User, SubscriptionPlan } = require('../models');
    
    // التحقق من وجود خطط الاشتراك وإنشائها إذا لم تكن موجودة
    const subscriptionPlans = [
      { name: 'الابتدائية', code: 'basic', description: 'الباقة الابتدائية للمكاتب الصغيرة', price: 99.99, duration: 30, features: JSON.stringify(['إدارة القضايا الأساسية', 'إدارة العملاء', 'إدارة المستندات الأساسية']) },
      { name: 'الأساسية', code: 'standard', description: 'الباقة الأساسية للمكاتب المتوسطة', price: 199.99, duration: 30, features: JSON.stringify(['إدارة القضايا المتقدمة', 'إدارة العملاء', 'إدارة المستندات المتقدمة', 'إدارة العقود', 'التقويم والمواعيد']) },
      { name: 'الاحترافية', code: 'professional', description: 'الباقة الاحترافية للمكاتب الكبيرة', price: 299.99, duration: 30, features: JSON.stringify(['جميع ميزات الباقة الأساسية', 'إدارة الموارد البشرية', 'إدارة المالية', 'تتبع الوقت', 'التحليلات الأساسية']) },
      { name: 'المؤسسية', code: 'enterprise', description: 'الباقة المؤسسية للشركات الكبرى', price: 499.99, duration: 30, features: JSON.stringify(['جميع ميزات الباقة الاحترافية', 'دعم مخصص', 'تحليلات متقدمة', 'تكامل API', 'نسخ احتياطي متقدم', 'تخصيص كامل']) }
    ];
    
    for (const plan of subscriptionPlans) {
      await SubscriptionPlan.findOrCreate({
        where: { code: plan.code },
        defaults: plan
      });
    }
    
    console.log('تم إنشاء خطط الاشتراك الأولية بنجاح أو كانت موجودة بالفعل.');
    
    // إنشاء مستأجر للتطوير إذا لم يكن موجوداً
    const [tenant, tenantCreated] = await Tenant.findOrCreate({
      where: { account_number: '123456' },
      defaults: {
        name: 'مكتب المحاماة للتطوير',
        subdomain: 'dev',
        status: 'active',
        subscription_plan: 'enterprise',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // سنة واحدة
        contact_email: 'admin@adalalegalis.com',
        contact_phone: '+966500000000',
        address: 'الرياض، المملكة العربية السعودية',
        city: 'الرياض',
        country: 'المملكة العربية السعودية',
        settings: JSON.stringify({
          theme: 'light',
          language: 'ar',
          timezone: 'Asia/Riyadh'
        })
      }
    });
    
    if (tenantCreated) {
      console.log('تم إنشاء مستأجر للتطوير بنجاح.');
      
      // إنشاء مستخدم مشرف للتطوير
      const bcrypt = require('bcryptjs');
      const passwordHash = bcrypt.hashSync('Admin@123', 10);
      
      await User.create({
        tenant_id: tenant.id,
        email: 'admin@adalalegalis.com',
        password_hash: passwordHash,
        first_name: 'مشرف',
        last_name: 'النظام',
        role: 'admin',
        language: 'ar',
        status: 'active',
        email_verified: true
      });
      
      console.log('تم إنشاء مستخدم مشرف للتطوير بنجاح.');
    } else {
      console.log('مستأجر التطوير موجود بالفعل.');
    }
    
  } catch (error) {
    console.error('فشل إنشاء البيانات الأولية:', error);
  }
}

module.exports = {
  initializeDatabase,
  createInitialData
};
