# دليل إعداد وتشغيل نظام Adalalegalis الشامل للمبتدئين

## جدول المحتويات
1. [مقدمة](#مقدمة)
2. [متطلبات النظام](#متطلبات-النظام)
3. [هيكل المشروع](#هيكل-المشروع)
4. [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
5. [تثبيت وإعداد المشروع المحلي](#تثبيت-وإعداد-المشروع-المحلي)
6. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
7. [تشغيل التطبيق محلياً](#تشغيل-التطبيق-محلياً)
8. [إعداد GitHub](#إعداد-github)
9. [النشر على Google Cloud](#النشر-على-google-cloud)
10. [استكشاف الأخطاء وإصلاحها](#استكشاف-الأخطاء-وإصلاحها)
11. [أمثلة وسيناريوهات الاستخدام](#أمثلة-وسيناريوهات-الاستخدام)

## مقدمة

نظام Adalalegalis هو منصة شاملة لإدارة الممارسات القانونية مصممة خصيصاً للمحامين والمكاتب القانونية. يوفر النظام مجموعة متكاملة من الوحدات لإدارة العملاء، القضايا، العقود، الاستشارات القانونية، المهام، المستندات، الشؤون المالية، الموارد البشرية، وتتبع الوقت.

هذا الدليل مصمم خصيصاً للمبتدئين ويهدف إلى مساعدتك في إعداد وتشغيل نظام Adalalegalis بسهولة. سنقوم بشرح كل خطوة بالتفصيل، بدءاً من متطلبات النظام وحتى نشر التطبيق على بيئة الإنتاج.

## متطلبات النظام

### متطلبات الأجهزة
- **المعالج**: Intel Core i5 أو ما يعادله (يُفضل i7 للتطوير)
- **الذاكرة**: 8 جيجابايت RAM على الأقل (يُفضل 16 جيجابايت للتطوير)
- **مساحة التخزين**: 20 جيجابايت على الأقل من المساحة الحرة

### متطلبات البرمجيات
- **نظام التشغيل**: Windows 10/11، macOS 10.15+، أو Ubuntu 20.04+
- **Node.js**: الإصدار 16.x أو أحدث
- **npm**: الإصدار 8.x أو أحدث
- **Angular CLI**: الإصدار 14.x أو أحدث
- **MySQL**: الإصدار 8.0 أو أحدث
- **Python**: الإصدار 3.8 أو أحدث (لوحدة التعلم الآلي)
- **Docker**: الإصدار 20.10 أو أحدث (للنشر)
- **Git**: الإصدار 2.30 أو أحدث

### متطلبات الشبكة
- اتصال إنترنت مستقر
- منفذ 3000 متاح للخلفية (Backend)
- منفذ 4200 متاح للواجهة الأمامية (Frontend)
- منفذ 5000 متاح لخدمة التعلم الآلي (ML)

## هيكل المشروع

نظام Adalalegalis يتكون من أربعة مكونات رئيسية:

### 1. الواجهة الأمامية (Frontend)
موجودة في مجلد `/frontend` وتستخدم إطار عمل Angular. تتضمن:

```
frontend/
├── src/                    # شيفرة المصدر
│   ├── app/                # مكونات التطبيق
│   │   ├── core/           # الخدمات والمكونات الأساسية
│   │   ├── features/       # وحدات ميزات التطبيق
│   │   │   ├── admin-dashboard/    # لوحة تحكم المشرف
│   │   │   ├── auth/               # المصادقة والتفويض
│   │   │   ├── landing/            # صفحة الهبوط
│   │   │   ├── cases/              # إدارة القضايا
│   │   │   ├── clients/            # إدارة العملاء
│   │   │   ├── contracts/          # إدارة العقود
│   │   │   ├── documents/          # إدارة المستندات
│   │   │   ├── finance/            # الإدارة المالية
│   │   │   ├── hr/                 # إدارة الموارد البشرية
│   │   │   ├── tasks/              # إدارة المهام
│   │   │   └── time-tracking/      # تتبع الوقت
│   │   └── shared/         # المكونات المشتركة
│   ├── assets/             # الصور والملفات الثابتة
│   └── environments/       # ملفات التكوين البيئية
├── angular.json            # تكوين Angular
└── package.json            # تبعيات المشروع
```

### 2. الخلفية (Backend)
موجودة في مجلد `/backend` وتستخدم Node.js مع Express. تتضمن:

```
backend/
├── src/                    # شيفرة المصدر
│   ├── config/             # ملفات التكوين
│   │   ├── app.config.js   # تكوين التطبيق العام
│   │   ├── auth.config.js  # تكوين المصادقة
│   │   ├── database.js     # تكوين قاعدة البيانات
│   │   └── db-init.js      # تهيئة قاعدة البيانات
│   ├── controllers/        # وحدات التحكم
│   ├── middleware/         # البرمجيات الوسيطة
│   ├── models/             # نماذج البيانات
│   ├── routes/             # مسارات API
│   ├── services/           # خدمات التطبيق
│   └── utils/              # أدوات مساعدة
├── tests/                  # اختبارات الوحدة
└── package.json            # تبعيات المشروع
```

### 3. خدمة التعلم الآلي (ML)
موجودة في مجلد `/ml` وتستخدم Python مع Flask. تتضمن:

```
ml/
├── app.py                  # تطبيق Flask الرئيسي
├── models/                 # نماذج التعلم الآلي
├── utils/                  # أدوات مساعدة
└── requirements.txt        # تبعيات Python
```

### 4. ملفات النشر (Kubernetes)
موجودة في مجلد `/kubernetes` وتتضمن ملفات تكوين Kubernetes للنشر:

```
kubernetes/
├── frontend-deployment.yaml
├── backend-deployment.yaml
├── ml-deployment.yaml
├── database-deployment.yaml
└── ingress.yaml
```

## إعداد بيئة التطوير

### تثبيت Node.js و npm

1. قم بزيارة [موقع Node.js الرسمي](https://nodejs.org/) وتنزيل أحدث إصدار LTS.
2. اتبع تعليمات التثبيت لنظام التشغيل الخاص بك.
3. تحقق من التثبيت بتنفيذ الأوامر التالية في نافذة الطرفية:

```bash
node --version
npm --version
```

### تثبيت Angular CLI

بعد تثبيت Node.js و npm، قم بتثبيت Angular CLI عالمياً باستخدام الأمر التالي:

```bash
npm install -g @angular/cli
```

تحقق من التثبيت:

```bash
ng version
```

### تثبيت MySQL

#### على Windows:
1. قم بتنزيل [MySQL Installer](https://dev.mysql.com/downloads/installer/) وتشغيله.
2. اختر "Developer Default" للتثبيت الكامل.
3. اتبع معالج التثبيت وقم بتعيين كلمة مرور لمستخدم الجذر (root).

#### على macOS:
1. استخدم Homebrew لتثبيت MySQL:
```bash
brew install mysql
```
2. ابدأ خدمة MySQL:
```bash
brew services start mysql
```
3. قم بتعيين كلمة مرور لمستخدم الجذر:
```bash
mysql_secure_installation
```

#### على Ubuntu:
1. قم بتثبيت MySQL باستخدام apt:
```bash
sudo apt update
sudo apt install mysql-server
```
2. قم بتكوين الأمان:
```bash
sudo mysql_secure_installation
```

### تثبيت Python وبيئة التعلم الآلي

1. قم بتنزيل وتثبيت [Python](https://www.python.org/downloads/) (الإصدار 3.8 أو أحدث).
2. تحقق من التثبيت:
```bash
python --version
```
3. قم بتثبيت pip إذا لم يكن مثبتاً بالفعل:
```bash
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

### تثبيت Git

#### على Windows:
1. قم بتنزيل وتثبيت [Git for Windows](https://gitforwindows.org/).
2. اتبع معالج التثبيت مع الإعدادات الافتراضية.

#### على macOS:
1. استخدم Homebrew:
```bash
brew install git
```

#### على Ubuntu:
```bash
sudo apt update
sudo apt install git
```

تحقق من التثبيت:
```bash
git --version
```

### تثبيت Docker (اختياري للتطوير المحلي، مطلوب للنشر)

#### على Windows:
1. قم بتنزيل وتثبيت [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop).
2. تأكد من تمكين WSL 2 (Windows Subsystem for Linux).

#### على macOS:
1. قم بتنزيل وتثبيت [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop).

#### على Ubuntu:
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```
(قم بتسجيل الخروج وإعادة تسجيل الدخول لتطبيق تغييرات المجموعة)

تحقق من التثبيت:
```bash
docker --version
```

## تثبيت وإعداد المشروع المحلي

### 1. استنساخ المستودع

```bash
git clone https://github.com/yourusername/adalalagalisv16.git
cd adalalagalisv16
```

### 2. إعداد الواجهة الأمامية (Frontend)

```bash
cd frontend
npm install
```

### 3. إعداد الخلفية (Backend)

```bash
cd ../backend
npm install
```

### 4. إعداد خدمة التعلم الآلي (ML)

```bash
cd ../ml
pip install -r requirements.txt
```

## إعداد قاعدة البيانات

### 1. إنشاء قاعدة البيانات

قم بتسجيل الدخول إلى MySQL:

```bash
mysql -u root -p
```

أدخل كلمة المرور التي قمت بتعيينها أثناء التثبيت.

قم بإنشاء قاعدة البيانات والمستخدم:

```sql
CREATE DATABASE adalalegalis;
CREATE USER 'adalalegalis_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON adalalegalis.* TO 'adalalegalis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. تكوين اتصال قاعدة البيانات

قم بتعديل ملف التكوين في `/backend/src/config/database.js`:

```javascript
// تأكد من تحديث هذه القيم وفقاً لإعدادك المحلي
module.exports = {
  development: {
    username: "adalalegalis",
    password: "admin@123",
    database: "adalalegalis",
    host: "localhost",
    dialect: "mysql",
    port: 3306,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  // إعدادات أخرى للاختبار والإنتاج...
};
```

### 3. تهيئة قاعدة البيانات

قم بتشغيل سكريبت تهيئة قاعدة البيانات:

```bash
cd backend
node src/config/db-init.js
```

## تشغيل التطبيق محلياً

### 1. تشغيل الخلفية (Backend)

في مجلد `/backend`:

```bash
npm run dev
```

هذا سيبدأ خادم الخلفية على المنفذ 3000.

### 2. تشغيل الواجهة الأمامية (Frontend)

في مجلد `/frontend`:

```bash
npm start
```

هذا سيبدأ خادم التطوير للواجهة الأمامية على المنفذ 4200.

### 3. تشغيل خدمة التعلم الآلي (ML)

في مجلد `/ml`:

```bash
python app.py
```

هذا سيبدأ خدمة التعلم الآلي على المنفذ 5000.

### 4. الوصول إلى التطبيق

افتح متصفحك وانتقل إلى:
- الواجهة الأمامية: `http://localhost:4200`
- واجهة برمجة تطبيقات الخلفية: `http://localhost:3000/api`
- واجهة برمجة تطبيقات التعلم الآلي: `http://localhost:5000/api`

## إعداد GitHub

### 1. إنشاء مستودع GitHub

1. قم بتسجيل الدخول إلى [GitHub](https://github.com/).
2. انقر على "New" لإنشاء مستودع جديد.
3. أدخل اسم المستودع: `adalalegalis`.
4. اختر "Private" للخصوصية.
5. انقر على "Create repository".

### 2. ربط المستودع المحلي بـ GitHub

في مجلد المشروع الرئيسي:

```bash
git remote add origin https://github.com/yourusername/adalalegalis.git
git branch -M main
git push -u origin main
```

### 3. إعداد GitHub Actions للتكامل المستمر (CI/CD)

أنشئ ملف `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Backend Dependencies
        run: cd backend && npm install
      - name: Run Backend Tests
        run: cd backend && npm test
      - name: Install Frontend Dependencies
        run: cd frontend && npm install
      - name: Run Frontend Tests
        run: cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Build Backend
        run: cd backend && npm install && npm run build
      - name: Build Frontend
        run: cd frontend && npm install && npm run build:prod
      - name: Upload Frontend Artifact
        uses: actions/upload-artifact@v2
        with:
          name: frontend-build
          path: frontend/dist
      - name: Upload Backend Artifact
        uses: actions/upload-artifact@v2
        with:
          name: backend-build
          path: backend/dist
```

## النشر على Google Cloud

### 1. إعداد مشروع Google Cloud

1. قم بإنشاء حساب على [Google Cloud](https://cloud.google.com/) إذا لم يكن لديك واحد.
2. قم بإنشاء مشروع جديد من [لوحة التحكم](https://console.cloud.google.com/).
3. قم بتمكين واجهات برمجة التطبيقات التالية:
   - Kubernetes Engine API
   - Container Registry API
   - Cloud SQL Admin API

### 2. تثبيت Google Cloud SDK

#### على Windows:
1. قم بتنزيل وتثبيت [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2. قم بتشغيل `gcloud init` واتبع التعليمات للمصادقة وتحديد المشروع.

#### على macOS/Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 3. إنشاء مجموعة Kubernetes

```bash
gcloud container clusters create adalalegalis-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2
```

### 4. إنشاء قاعدة بيانات Cloud SQL

```bash
gcloud sql instances create adalalegalis-db \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-standard-1 \
  --region=us-central1 \
  --root-password=your_strong_password

gcloud sql databases create adalalegalis --instance=adalalegalis-db

gcloud sql users create adalalegalis_user \
  --instance=adalalegalis-db \
  --password=your_strong_password
```

### 5. بناء ودفع صور Docker

```bash
# بناء صورة الخلفية
cd backend
docker build -t gcr.io/your-project-id/adalalegalis-backend:latest .
docker push gcr.io/your-project-id/adalalegalis-backend:latest

# بناء صورة الواجهة الأمامية
cd ../frontend
docker build -t gcr.io/your-project-id/adalalegalis-frontend:latest .
docker push gcr.io/your-project-id/adalalegalis-frontend:latest

# بناء صورة خدمة التعلم الآلي
cd ../ml
docker build -t gcr.io/your-project-id/adalalegalis-ml:latest .
docker push gcr.io/your-project-id/adalalegalis-ml:latest
```

### 6. تحديث ملفات Kubernetes

قم بتعديل ملفات النشر في مجلد `/kubernetes` لتحديث أسماء الصور وإعدادات الاتصال بقاعدة البيانات.

### 7. نشر التطبيق على Kubernetes

```bash
kubectl apply -f kubernetes/
```

### 8. الحصول على عنوان IP الخارجي

```bash
kubectl get ingress
```

استخدم عنوان IP المعروض للوصول إلى التطبيق المنشور.

### 9. تكوين اسم النطاق

1. قم بإضافة سجل A في إعدادات DNS لنطاقك يشير إلى عنوان IP الخارجي.
2. قم بتكوين HTTPS باستخدام Let's Encrypt:

```bash
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.5.3/cert-manager.yaml

# قم بإنشاء وتطبيق ملف issuer.yaml
kubectl apply -f kubernetes/issuer.yaml

# قم بتحديث ملف ingress.yaml لاستخدام الشهادة
kubectl apply -f kubernetes/ingress.yaml
```

## استكشاف الأخطاء وإصلاحها

### مشاكل الاتصال بقاعدة البيانات

**المشكلة**: لا يمكن للخلفية الاتصال بقاعدة البيانات.

**الحل**:
1. تأكد من أن خدمة MySQL قيد التشغيل:
   ```bash
   # على Windows
   sc query mysql
   
   # على macOS
   brew services list
   
   # على Ubuntu
   sudo systemctl status mysql
   ```
2. تحقق من صحة بيانات الاعتماد في ملف `database.js`.
3. تأكد من وجود قاعدة البيانات والمستخدم:
   ```bash
   mysql -u root -p
   SHOW DATABASES;
   SELECT User FROM mysql.user;
   ```

### مشاكل تشغيل الواجهة الأمامية

**المشكلة**: الواجهة الأمامية لا تعمل أو تظهر أخطاء.

**الحل**:
1. تأكد من تثبيت جميع التبعيات:
   ```bash
   cd frontend
   npm install
   ```
2. تحقق من ملف `environment.ts` للتأكد من صحة عناوين URL للخلفية وخدمة التعلم الآلي.
3. امسح ذاكرة التخزين المؤقت للمتصفح وأعد تحميل الصفحة.

### مشاكل خدمة التعلم الآلي

**المشكلة**: خدمة التعلم الآلي لا تعمل.

**الحل**:
1. تأكد من تثبيت جميع تبعيات Python:
   ```bash
   cd ml
   pip install -r requirements.txt
   ```
2. تحقق من وجود نماذج التعلم الآلي المطلوبة في مجلد `ml/models`.
3. تحقق من سجلات الخطأ:
   ```bash
   python app.py
   ```

### مشاكل النشر على Kubernetes

**المشكلة**: التطبيق لا يعمل بعد النشر على Kubernetes.

**الحل**:
1. تحقق من حالة الـ pods:
   ```bash
   kubectl get pods
   ```
2. اعرض سجلات الـ pod الذي يواجه مشكلة:
   ```bash
   kubectl logs <pod-name>
   ```
3. تحقق من الخدمات والـ ingress:
   ```bash
   kubectl get services
   kubectl get ingress
   ```

## أمثلة وسيناريوهات الاستخدام

### 1. إعداد نشاط تجاري (Business) جديد

1. انتقل إلى `https://www.adalalegalis.com/`
2. انقر على "إنشاء حساب جديد"
3. أدخل معلومات النشاط التجاري:
   - اسم النشاط التجاري
   - البريد الإلكتروني للاتصال
   - رقم الهاتف للاتصال
   - خطة الاشتراك (الابتدائية، الأساسية، الاحترافية، المؤسسية)
4. أكمل عملية التسجيل
5. ستتلقى رقم حساب مكون من 6 أرقام، احتفظ به لأنه سيكون مطلوباً لتسجيل الدخول

### 2. إنشاء مستخدم وتسجيل الدخول

1. انتقل إلى `https://www.adalalegalis.com/login`
2. أدخل:
   - البريد الإلكتروني
   - كلمة المرور
   - رقم الحساب المكون من 6 أرقام
3. انقر على "تسجيل الدخول"
4. ستتم إعادة توجيهك إلى لوحة التحكم الرئيسية

### 3. إدارة العملاء

1. من لوحة التحكم، انقر على "العملاء" في القائمة الجانبية
2. لإضافة عميل جديد، انقر على "إضافة عميل"
3. أدخل معلومات العميل:
   - الاسم الكامل
   - البريد الإلكتروني
   - رقم الهاتف
   - العنوان
   - معلومات إضافية
4. انقر على "حفظ"
5. يمكنك الآن عرض وتعديل وحذف العملاء من قائمة العملاء

### 4. إدارة العقود

1. من لوحة التحكم، انقر على "العقود" في القائمة الجانبية
2. لإنشاء عقد جديد، انقر على "إنشاء عقد"
3. اختر نوع العقد من القوالب المتاحة
4. اختر العميل من القائمة المنسدلة
5. أدخل تفاصيل العقد:
   - عنوان العقد
   - تاريخ البدء
   - تاريخ الانتهاء
   - القيمة
   - الشروط والأحكام
6. انقر على "إنشاء العقد"
7. يمكنك الآن عرض وتعديل وتتبع حالة العقود من قائمة العقود

### 5. استخدام ميزات التعلم الآلي

1. من لوحة التحكم، انقر على "المستندات" في القائمة الجانبية
2. قم بتحميل مستند قانوني بتنسيق PDF
3. انقر على "تحليل المستند"
4. سيقوم النظام باستخراج المعلومات الرئيسية تلقائياً:
   - أسماء الأطراف
   - التواريخ المهمة
   - البنود الرئيسية
   - المخاطر المحتملة
5. راجع النتائج وقم بتعديلها إذا لزم الأمر
6. انقر على "حفظ التحليل"

هذه مجرد أمثلة قليلة على كيفية استخدام نظام Adalalegalis. النظام يوفر العديد من الميزات الأخرى مثل إدارة القضايا، تتبع الوقت، إدارة المهام، والتقارير المالية.

---

للحصول على مساعدة إضافية أو الإبلاغ عن مشكلات، يرجى التواصل مع فريق الدعم على support@adalalegalis.com أو زيارة مركز المساعدة على https://www.adalalegalis.com/help.
