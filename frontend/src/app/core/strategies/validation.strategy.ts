import { Injectable } from '@angular/core';
import { ValidationStrategy } from './strategy.interfaces';

/**
 * استراتيجية التحقق من الصحة باستخدام القواعد المخصصة
 * تنفيذ لواجهة استراتيجية التحقق من الصحة باستخدام قواعد مخصصة
 */
@Injectable({
  providedIn: 'root'
})
export class CustomValidationStrategy implements ValidationStrategy {
  /**
   * قواعد التحقق من الصحة
   * @private
   */
  private rules: { [field: string]: (value: any) => string | null } = {};

  /**
   * إضافة قاعدة تحقق من الصحة
   * @param field اسم الحقل
   * @param rule دالة التحقق من الصحة
   */
  addRule(field: string, rule: (value: any) => string | null): void {
    this.rules[field] = rule;
  }

  /**
   * إزالة قاعدة تحقق من الصحة
   * @param field اسم الحقل
   */
  removeRule(field: string): void {
    delete this.rules[field];
  }

  /**
   * التحقق من صحة كيان
   * @param entity الكيان المراد التحقق من صحته
   * @returns كائن يحتوي على أخطاء التحقق من الصحة أو null إذا كان الكيان صحيحًا
   */
  validate(entity: any): { [key: string]: string } | null {
    const errors: { [key: string]: string } = {};
    let hasErrors = false;

    // تطبيق قواعد التحقق من الصحة على الكيان
    for (const field in this.rules) {
      if (Object.prototype.hasOwnProperty.call(this.rules, field)) {
        const rule = this.rules[field];
        const value = entity[field];
        const error = rule(value);

        if (error) {
          errors[field] = error;
          hasErrors = true;
        }
      }
    }

    return hasErrors ? errors : null;
  }
}

/**
 * استراتيجية التحقق من الصحة باستخدام JSON Schema
 * تنفيذ لواجهة استراتيجية التحقق من الصحة باستخدام JSON Schema
 */
@Injectable({
  providedIn: 'root'
})
export class JsonSchemaValidationStrategy implements ValidationStrategy {
  /**
   * مخطط JSON للتحقق من الصحة
   * @private
   */
  private schema: any;

  /**
   * تعيين مخطط JSON للتحقق من الصحة
   * @param schema مخطط JSON
   */
  setSchema(schema: any): void {
    this.schema = schema;
  }

  /**
   * التحقق من صحة كيان باستخدام مخطط JSON
   * @param entity الكيان المراد التحقق من صحته
   * @returns كائن يحتوي على أخطاء التحقق من الصحة أو null إذا كان الكيان صحيحًا
   */
  validate(entity: any): { [key: string]: string } | null {
    if (!this.schema) {
      console.error('لم يتم تعيين مخطط JSON للتحقق من الصحة');
      return null;
    }

    // هذا تنفيذ بسيط للتحقق من الصحة باستخدام مخطط JSON
    // في التطبيق الحقيقي، يمكن استخدام مكتبة مثل ajv للتحقق من الصحة
    const errors: { [key: string]: string } = {};
    let hasErrors = false;

    // التحقق من الخصائص المطلوبة
    if (this.schema.required) {
      for (const field of this.schema.required) {
        if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
          errors[field] = `الحقل ${field} مطلوب`;
          hasErrors = true;
        }
      }
    }

    // التحقق من نوع البيانات
    if (this.schema.properties) {
      for (const field in this.schema.properties) {
        if (Object.prototype.hasOwnProperty.call(this.schema.properties, field) && entity[field] !== undefined) {
          const propertySchema = this.schema.properties[field];
          const value = entity[field];

          // التحقق من النوع
          if (propertySchema.type && !this.checkType(value, propertySchema.type)) {
            errors[field] = `الحقل ${field} يجب أن يكون من النوع ${propertySchema.type}`;
            hasErrors = true;
          }

          // التحقق من الحد الأدنى والحد الأقصى للأرقام
          if (propertySchema.type === 'number' || propertySchema.type === 'integer') {
            if (propertySchema.minimum !== undefined && value < propertySchema.minimum) {
              errors[field] = `الحقل ${field} يجب أن يكون أكبر من أو يساوي ${propertySchema.minimum}`;
              hasErrors = true;
            }
            if (propertySchema.maximum !== undefined && value > propertySchema.maximum) {
              errors[field] = `الحقل ${field} يجب أن يكون أقل من أو يساوي ${propertySchema.maximum}`;
              hasErrors = true;
            }
          }

          // التحقق من الحد الأدنى والحد الأقصى لطول النصوص
          if (propertySchema.type === 'string') {
            if (propertySchema.minLength !== undefined && value.length < propertySchema.minLength) {
              errors[field] = `الحقل ${field} يجب أن يكون طوله على الأقل ${propertySchema.minLength} حرف`;
              hasErrors = true;
            }
            if (propertySchema.maxLength !== undefined && value.length > propertySchema.maxLength) {
              errors[field] = `الحقل ${field} يجب أن يكون طوله على الأكثر ${propertySchema.maxLength} حرف`;
              hasErrors = true;
            }
            if (propertySchema.pattern && !new RegExp(propertySchema.pattern).test(value)) {
              errors[field] = `الحقل ${field} يجب أن يتطابق مع النمط المحدد`;
              hasErrors = true;
            }
          }
        }
      }
    }

    return hasErrors ? errors : null;
  }

  /**
   * التحقق من نوع القيمة
   * @param value القيمة
   * @param type النوع المتوقع
   * @returns قيمة منطقية تشير إلى صحة النوع
   * @private
   */
  private checkType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return typeof value === 'number' && !isNaN(value) && Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return false;
    }
  }
}

/**
 * خدمة التحقق من الصحة
 * توفر واجهة موحدة للتحقق من الصحة مع دعم استراتيجيات مختلفة
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  /**
   * استراتيجية التحقق من الصحة الحالية
   * @private
   */
  private strategy: ValidationStrategy;

  /**
   * إنشاء نسخة من خدمة التحقق من الصحة
   * @param customStrategy استراتيجية التحقق من الصحة المخصصة
   * @param jsonSchemaStrategy استراتيجية التحقق من الصحة باستخدام JSON Schema
   */
  constructor(
    private customStrategy: CustomValidationStrategy,
    private jsonSchemaStrategy: JsonSchemaValidationStrategy
  ) {
    // استخدام استراتيجية التحقق من الصحة المخصصة كاستراتيجية افتراضية
    this.strategy = this.customStrategy;
  }

  /**
   * تعيين استراتيجية التحقق من الصحة
   * @param strategyType نوع الاستراتيجية
   */
  setStrategy(strategyType: 'custom' | 'jsonSchema'): void {
    this.strategy = strategyType === 'custom' ? this.customStrategy : this.jsonSchemaStrategy;
  }

  /**
   * التحقق من صحة كيان باستخدام الاستراتيجية الحالية
   * @param entity الكيان المراد التحقق من صحته
   * @returns كائن يحتوي على أخطاء التحقق من الصحة أو null إذا كان الكيان صحيحًا
   */
  validate(entity: any): { [key: string]: string } | null {
    return this.strategy.validate(entity);
  }

  /**
   * إضافة قاعدة تحقق من الصحة مخصصة
   * @param field اسم الحقل
   * @param rule دالة التحقق من الصحة
   */
  addCustomRule(field: string, rule: (value: any) => string | null): void {
    if (this.customStrategy) {
      this.customStrategy.addRule(field, rule);
    }
  }

  /**
   * تعيين مخطط JSON للتحقق من الصحة
   * @param schema مخطط JSON
   */
  setJsonSchema(schema: any): void {
    if (this.jsonSchemaStrategy) {
      this.jsonSchemaStrategy.setSchema(schema);
    }
  }
}
