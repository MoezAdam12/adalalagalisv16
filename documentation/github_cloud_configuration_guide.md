# دليل تكوين GitHub وGoogle Cloud لنظام Adalalegalis

هذا الدليل يقدم شرحاً مفصلاً لإعداد وتكوين GitHub وGoogle Cloud لتطوير ونشر نظام Adalalegalis، مع تعليمات خطوة بخطوة لكل مرحلة من مراحل العملية.

## جدول المحتويات
1. [إعداد مستودع GitHub](#إعداد-مستودع-github)
2. [تكوين CI/CD في GitHub Actions](#تكوين-cicd-في-github-actions)
3. [إعداد Google Cloud Project](#إعداد-google-cloud-project)
4. [نشر التطبيق على Google Kubernetes Engine](#نشر-التطبيق-على-google-kubernetes-engine)
5. [إعداد Cloud SQL لقاعدة البيانات](#إعداد-cloud-sql-لقاعدة-البيانات)
6. [تكوين النطاق وشهادات SSL](#تكوين-النطاق-وشهادات-ssl)
7. [إعداد المراقبة والتنبيهات](#إعداد-المراقبة-والتنبيهات)
8. [إدارة الإصدارات والنشر](#إدارة-الإصدارات-والنشر)

## إعداد مستودع GitHub

### إنشاء حساب GitHub

1. قم بزيارة [موقع GitHub](https://github.com/) وانقر على "Sign up".
2. أدخل بريدك الإلكتروني وكلمة مرور وأكمل عملية التسجيل.
3. قم بتأكيد بريدك الإلكتروني من خلال النقر على الرابط المرسل إليك.

### إنشاء مستودع جديد

1. قم بتسجيل الدخول إلى حسابك على GitHub.
2. انقر على زر "+" في الزاوية العلوية اليمنى واختر "New repository".
3. أدخل المعلومات التالية:
   - اسم المستودع: `adalalegalis`
   - الوصف: `نظام شامل لإدارة الممارسات القانونية`
   - نوع المستودع: `Private` (خاص)
   - حدد "Initialize this repository with a README"
   - اختر `.gitignore`: `Node`
   - اختر الترخيص المناسب (مثل MIT License)
4. انقر على "Create repository".

### إعداد حماية الفروع

1. انتقل إلى مستودعك الجديد.
2. انقر على "Settings" في شريط التنقل العلوي.
3. انقر على "Branches" في القائمة الجانبية.
4. انقر على "Add rule" تحت "Branch protection rules".
5. أدخل `main` في حقل "Branch name pattern".
6. حدد الخيارات التالية:
   - "Require pull request reviews before merging"
   - "Require status checks to pass before merging"
   - "Require branches to be up to date before merging"
   - "Include administrators"
7. انقر على "Create".

### إعداد الفريق والأذونات

1. انتقل إلى "Settings" > "Manage access".
2. انقر على "Invite a collaborator".
3. أدخل أسماء المستخدمين أو عناوين البريد الإلكتروني لأعضاء الفريق.
4. حدد مستوى الوصول المناسب لكل عضو (Write، Maintain، أو Admin).

### ربط المستودع المحلي بـ GitHub

1. قم بتهيئة Git في المشروع المحلي (إذا لم تكن قد فعلت ذلك بالفعل):
   ```bash
   cd /path/to/adalalegalis
   git init
   ```

2. أضف ملف `.gitignore` إذا لم يكن موجوداً:
   ```bash
   # Node.js
   node_modules/
   npm-debug.log
   yarn-error.log
   
   # Angular
   /frontend/dist
   /frontend/.angular
   
   # Python
   /ml/venv/
   /ml/__pycache__/
   *.pyc
   
   # Environment variables
   .env
   .env.local
   
   # IDE
   .idea/
   .vscode/
   *.swp
   *.swo
   
   # OS
   .DS_Store
   Thumbs.db
   ```

3. قم بإضافة الملفات وإنشاء الالتزام الأولي:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

4. أضف المستودع البعيد وادفع الشيفرة:
   ```bash
   git remote add origin https://github.com/yourusername/adalalegalis.git
   git branch -M main
   git push -u origin main
   ```

### إعداد قواعد المساهمة

1. أنشئ ملف `CONTRIBUTING.md` في جذر المشروع:
   ```markdown
   # دليل المساهمة في مشروع Adalalegalis
   
   شكراً لاهتمامك بالمساهمة في مشروع Adalalegalis! هذا الدليل يوضح عملية المساهمة وأفضل الممارسات.
   
   ## سير العمل للمساهمة
   
   1. قم بإنشاء fork للمستودع
   2. قم بإنشاء فرع جديد لميزتك أو إصلاحك (`git checkout -b feature/amazing-feature`)
   3. قم بالالتزام بالتغييرات (`git commit -m 'Add amazing feature'`)
   4. قم بدفع الفرع (`git push origin feature/amazing-feature`)
   5. قم بفتح طلب سحب (Pull Request)
   
   ## اصطلاحات التسمية
   
   ### فروع Git
   - `feature/*`: للميزات الجديدة
   - `bugfix/*`: لإصلاحات الأخطاء
   - `hotfix/*`: لإصلاحات عاجلة في الإنتاج
   - `release/*`: لإصدارات جديدة
   
   ### رسائل الالتزام
   استخدم [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat`: ميزة جديدة
   - `fix`: إصلاح خطأ
   - `docs`: تغييرات في التوثيق
   - `style`: تنسيق، إضافة مسافات، إلخ
   - `refactor`: إعادة هيكلة الشيفرة
   - `test`: إضافة أو تعديل اختبارات
   - `chore`: تحديثات للأدوات، التبعيات، إلخ
   
   مثال: `feat(auth): add multi-tenant login`
   
   ## معايير الشيفرة
   
   - اتبع أسلوب الشيفرة المحدد في ESLint وPrettier
   - اكتب اختبارات لجميع الميزات والإصلاحات
   - حافظ على تغطية الاختبارات عند 80% على الأقل
   - وثّق جميع الدوال والفئات الجديدة
   
   ## عملية المراجعة
   
   سيتم مراجعة طلبات السحب من قبل مالكي المشروع. قد نطلب تغييرات قبل دمج طلب السحب.
   ```

2. أنشئ ملف `.github/PULL_REQUEST_TEMPLATE.md`:
   ```markdown
   ## وصف
   
   وصف موجز للتغييرات التي قمت بها.
   
   ## نوع التغيير
   
   - [ ] ميزة جديدة (تغيير غير مكسر يضيف وظيفة)
   - [ ] إصلاح خطأ (تغيير غير مكسر يصلح مشكلة)
   - [ ] تغيير مكسر (إصلاح أو ميزة تسبب تعطل وظائف موجودة)
   - [ ] تحسين أداء
   - [ ] تحديث توثيق
   
   ## كيف تم اختباره؟
   
   وصف الاختبارات التي أجريتها للتحقق من التغييرات.
   
   ## قائمة مراجعة:
   
   - [ ] شيفرتي تتبع إرشادات أسلوب المشروع
   - [ ] قمت بإجراء مراجعة ذاتية لشيفرتي
   - [ ] قمت بالتعليق على الشيفرة الصعبة الفهم
   - [ ] قمت بإجراء التغييرات المناسبة في التوثيق
   - [ ] تغييراتي لا تولد تحذيرات جديدة
   - [ ] أضفت اختبارات تثبت أن إصلاحي فعال أو أن ميزتي تعمل
   - [ ] الاختبارات الجديدة والموجودة تمر محلياً مع تغييراتي
   ```

## تكوين CI/CD في GitHub Actions

### إعداد سير عمل CI/CD الأساسي

1. أنشئ مجلد `.github/workflows` في جذر المشروع:
   ```bash
   mkdir -p .github/workflows
   ```

2. أنشئ ملف `.github/workflows/ci-cd.yml`:
   ```yaml
   name: CI/CD Pipeline

   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main, develop ]

   jobs:
     lint:
       name: Lint
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '16'
             cache: 'npm'
         - name: Install Backend Dependencies
           run: cd backend && npm ci
         - name: Lint Backend
           run: cd backend && npm run lint
         - name: Install Frontend Dependencies
           run: cd frontend && npm ci
         - name: Lint Frontend
           run: cd frontend && npm run lint
         - name: Set up Python
           uses: actions/setup-python@v4
           with:
             python-version: '3.8'
         - name: Install ML Dependencies
           run: cd ml && pip install -r requirements.txt
         - name: Lint ML
           run: cd ml && pip install pylint && pylint --disable=C0111,C0103 *.py

     test:
       name: Test
       needs: lint
       runs-on: ubuntu-latest
       services:
         mysql:
           image: mysql:8.0
           env:
             MYSQL_ROOT_PASSWORD: root
             MYSQL_DATABASE: adalalegalis_test
           ports:
             - 3306:3306
           options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '16'
             cache: 'npm'
         - name: Install Backend Dependencies
           run: cd backend && npm ci
         - name: Run Backend Tests
           run: cd backend && npm test
           env:
             DB_HOST: localhost
             DB_USER: root
             DB_PASSWORD: root
             DB_NAME: adalalegalis_test
             JWT_SECRET: test_secret
         - name: Install Frontend Dependencies
           run: cd frontend && npm ci
         - name: Run Frontend Tests
           run: cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
         - name: Set up Python
           uses: actions/setup-python@v4
           with:
             python-version: '3.8'
         - name: Install ML Dependencies
           run: cd ml && pip install -r requirements.txt
         - name: Run ML Tests
           run: cd ml && python -m unittest discover

     build:
       name: Build
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '16'
             cache: 'npm'
         - name: Install Backend Dependencies
           run: cd backend && npm ci
         - name: Build Backend
           run: cd backend && npm run build
         - name: Install Frontend Dependencies
           run: cd frontend && npm ci
         - name: Build Frontend
           run: cd frontend && npm run build:prod
         - name: Upload Frontend Artifact
           uses: actions/upload-artifact@v3
           with:
             name: frontend-build
             path: frontend/dist
         - name: Upload Backend Artifact
           uses: actions/upload-artifact@v3
           with:
             name: backend-build
             path: backend/dist

     deploy:
       name: Deploy
       needs: build
       if: github.ref == 'refs/heads/main' && github.event_name == 'push'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Download Frontend Artifact
           uses: actions/download-artifact@v3
           with:
             name: frontend-build
             path: frontend/dist
         - name: Download Backend Artifact
           uses: actions/download-artifact@v3
           with:
             name: backend-build
             path: backend/dist
         - name: Set up Google Cloud SDK
           uses: google-github-actions/setup-gcloud@v0
           with:
             project_id: ${{ secrets.GCP_PROJECT_ID }}
             service_account_key: ${{ secrets.GCP_SA_KEY }}
             export_default_credentials: true
         - name: Configure Docker
           run: gcloud auth configure-docker
         - name: Build and Push Backend Docker Image
           run: |
             cd backend
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.sha }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.sha }}
         - name: Build and Push Frontend Docker Image
           run: |
             cd frontend
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.sha }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.sha }}
         - name: Build and Push ML Docker Image
           run: |
             cd ml
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.sha }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.sha }}
         - name: Update Kubernetes Manifests
           run: |
             cd kubernetes
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-backend:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.sha }}|g" backend-deployment.yaml
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-frontend:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.sha }}|g" frontend-deployment.yaml
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-ml:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.sha }}|g" ml-deployment.yaml
         - name: Deploy to GKE
           run: |
             gcloud container clusters get-credentials adalalegalis-cluster --zone us-central1-a
             kubectl apply -f kubernetes/
             kubectl rollout status deployment/adalalegalis-backend
             kubectl rollout status deployment/adalalegalis-frontend
             kubectl rollout status deployment/adalalegalis-ml
   ```

### إعداد أسرار GitHub (GitHub Secrets)

1. انتقل إلى "Settings" > "Secrets" > "Actions" في مستودع GitHub.
2. انقر على "New repository secret".
3. أضف الأسرار التالية:
   - `GCP_PROJECT_ID`: معرف مشروع Google Cloud
   - `GCP_SA_KEY`: مفتاح حساب الخدمة لـ Google Cloud (JSON مشفر Base64)
   - `DB_PASSWORD`: كلمة مرور قاعدة البيانات
   - `JWT_SECRET`: مفتاح سري لتوقيع JWT

### إعداد سير عمل النشر التلقائي

1. أنشئ ملف `.github/workflows/deploy-prod.yml`:
   ```yaml
   name: Deploy to Production

   on:
     release:
       types: [published]

   jobs:
     deploy-prod:
       name: Deploy to Production
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Google Cloud SDK
           uses: google-github-actions/setup-gcloud@v0
           with:
             project_id: ${{ secrets.GCP_PROJECT_ID }}
             service_account_key: ${{ secrets.GCP_SA_KEY }}
             export_default_credentials: true
         - name: Configure Docker
           run: gcloud auth configure-docker
         - name: Build and Push Backend Docker Image
           run: |
             cd backend
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.event.release.tag_name }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.event.release.tag_name }}
         - name: Build and Push Frontend Docker Image
           run: |
             cd frontend
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.event.release.tag_name }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.event.release.tag_name }}
         - name: Build and Push ML Docker Image
           run: |
             cd ml
             docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.event.release.tag_name }} .
             docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.event.release.tag_name }}
         - name: Update Kubernetes Manifests
           run: |
             cd kubernetes/prod
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-backend:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-backend:${{ github.event.release.tag_name }}|g" backend-deployment.yaml
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-frontend:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-frontend:${{ github.event.release.tag_name }}|g" frontend-deployment.yaml
             sed -i "s|gcr.io/PROJECT_ID/adalalegalis-ml:.*|gcr.io/${{ secrets.GCP_PROJECT_ID }}/adalalegalis-ml:${{ github.event.release.tag_name }}|g" ml-deployment.yaml
         - name: Deploy to Production GKE
           run: |
             gcloud container clusters get-credentials adalalegalis-prod-cluster --zone us-central1-a
             kubectl apply -f kubernetes/prod/
             kubectl rollout status deployment/adalalegalis-backend
             kubectl rollout status deployment/adalalegalis-frontend
             kubectl rollout status deployment/adalalegalis-ml
   ```

### إعداد سير عمل التحليل الأمني

1. أنشئ ملف `.github/workflows/security-scan.yml`:
   ```yaml
   name: Security Scan

   on:
     schedule:
       - cron: '0 0 * * 0'  # تشغيل كل يوم أحد في الساعة 00:00 UTC
     workflow_dispatch:  # السماح بالتشغيل اليدوي

   jobs:
     security-scan:
       name: Security Scan
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '16'
         - name: Install npm-audit-resolver
           run: npm install -g npm-audit-resolver
         - name: Scan Backend Dependencies
           run: |
             cd backend
             npm audit --json > npm-audit.json || true
             npx auditjs ossi --whitelist ./.auditjs.yml || true
         - name: Scan Frontend Dependencies
           run: |
             cd frontend
             npm audit --json > npm-audit.json || true
         - name: Set up Python
           uses: actions/setup-python@v4
           with:
             python-version: '3.8'
         - name: Install Safety
           run: pip install safety
         - name: Scan Python Dependencies
           run: |
             cd ml
             safety check -r requirements.txt --json > safety-report.json || true
         - name: Upload Security Reports
           uses: actions/upload-artifact@v3
           with:
             name: security-reports
             path: |
               backend/npm-audit.json
               frontend/npm-audit.json
               ml/safety-report.json
   ```

## إعداد Google Cloud Project

### إنشاء مشروع Google Cloud

1. قم بزيارة [Google Cloud Console](https://console.cloud.google.com/).
2. انقر على القائمة المنسدلة للمشروع في الزاوية العلوية اليسرى.
3. انقر على "مشروع جديد".
4. أدخل اسم المشروع: `adalalegalis`.
5. اختر المؤسسة والموقع المناسبين (إذا كان متاحاً).
6. انقر على "إنشاء".

### تمكين واجهات برمجة التطبيقات المطلوبة

1. انتقل إلى "واجهات برمجة التطبيقات والخدمات" > "واجهات برمجة التطبيقات المُمكّنة".
2. انقر على "تمكين واجهات برمجة التطبيقات والخدمات".
3. ابحث عن واجهات برمجة التطبيقات التالية وقم بتمكينها:
   - Kubernetes Engine API
   - Container Registry API
   - Cloud SQL Admin API
   - Cloud Storage API
   - Cloud Monitoring API
   - Cloud Logging API
   - Cloud Trace API
   - Cloud Build API
   - Secret Manager API

### إعداد حساب الخدمة

1. انتقل إلى "واجهات برمجة التطبيقات والخدمات" > "بيانات اعتماد".
2. انقر على "إنشاء بيانات اعتماد" > "حساب خدمة".
3. أدخل اسم حساب الخدمة: `adalalegalis-ci-cd`.
4. أدخل وصفاً: `حساب خدمة لـ CI/CD`.
5. انقر على "إنشاء وتابع".
6. أضف الأدوار التالية:
   - Kubernetes Engine Admin
   - Storage Admin
   - Cloud SQL Admin
   - Secret Manager Admin
   - Service Account User
7. انقر على "تم".
8. انقر على حساب الخدمة الذي تم إنشاؤه.
9. انتقل إلى علامة التبويب "المفاتيح".
10. انقر على "إضافة مفتاح" > "إنشاء مفتاح جديد".
11. اختر "JSON" وانقر على "إنشاء".
12. سيتم تنزيل ملف JSON. احتفظ به بأمان واستخدمه لإعداد `GCP_SA_KEY` في أسرار GitHub.

### تكوين الفوترة

1. انتقل إلى "الفوترة" في لوحة تحكم Google Cloud.
2. ربط حساب فوترة بالمشروع.
3. قم بإعداد تنبيهات الفوترة:
   - انقر على "تنبيهات الفوترة".
   - انقر على "إنشاء تنبيه".
   - حدد المبلغ الذي تريد تلقي تنبيه عنده.
   - أدخل عنوان البريد الإلكتروني لتلقي التنبيهات.

### إعداد مناطق وشبكات Google Cloud

1. انتقل إلى "VPC Network" > "شبكات VPC".
2. انقر على "إنشاء شبكة VPC".
3. أدخل اسم الشبكة: `adalalegalis-network`.
4. أضف نطاق عناوين IP الفرعية:
   - اسم: `adalalegalis-subnet`
   - منطقة: `us-central1`
   - نطاق عناوين IP: `10.0.0.0/20`
5. انقر على "إنشاء".

## نشر التطبيق على Google Kubernetes Engine

### إنشاء مجموعة Kubernetes

1. انتقل إلى "Kubernetes Engine" > "مجموعات".
2. انقر على "إنشاء".
3. اختر "Standard".
4. أدخل اسم المجموعة: `adalalegalis-cluster`.
5. اختر المنطقة: `us-central1-a`.
6. اختر إصدار Kubernetes: أحدث إصدار مستقر.
7. تكوين تجمع العقد:
   - اسم تجمع العقد: `default-pool`
   - عدد العقد: 3
   - نوع الآلة: `e2-standard-2` (2 vCPU، 8 GB ذاكرة)
8. انقر على "إنشاء".

### إعداد ملفات نشر Kubernetes

1. أنشئ مجلد `kubernetes` في جذر المشروع:
   ```bash
   mkdir -p kubernetes
   ```

2. أنشئ ملف `kubernetes/namespace.yaml`:
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: adalalegalis
   ```

3. أنشئ ملف `kubernetes/backend-deployment.yaml`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: adalalegalis-backend
     namespace: adalalegalis
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: adalalegalis-backend
     template:
       metadata:
         labels:
           app: adalalegalis-backend
       spec:
         containers:
         - name: backend
           image: gcr.io/PROJECT_ID/adalalegalis-backend:latest
           ports:
           - containerPort: 3000
           env:
           - name: NODE_ENV
             value: "production"
           - name: DB_HOST
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: host
           - name: DB_USER
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: username
           - name: DB_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: password
           - name: DB_NAME
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: database
           - name: JWT_SECRET
             valueFrom:
               secretKeyRef:
                 name: app-secrets
                 key: jwt-secret
           resources:
             requests:
               cpu: "100m"
               memory: "256Mi"
             limits:
               cpu: "500m"
               memory: "512Mi"
           readinessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 10
             periodSeconds: 5
           livenessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 20
             periodSeconds: 15
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: adalalegalis-backend
     namespace: adalalegalis
   spec:
     selector:
       app: adalalegalis-backend
     ports:
     - port: 80
       targetPort: 3000
     type: ClusterIP
   ```

4. أنشئ ملف `kubernetes/frontend-deployment.yaml`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: adalalegalis-frontend
     namespace: adalalegalis
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: adalalegalis-frontend
     template:
       metadata:
         labels:
           app: adalalegalis-frontend
       spec:
         containers:
         - name: frontend
           image: gcr.io/PROJECT_ID/adalalegalis-frontend:latest
           ports:
           - containerPort: 80
           resources:
             requests:
               cpu: "100m"
               memory: "128Mi"
             limits:
               cpu: "300m"
               memory: "256Mi"
           readinessProbe:
             httpGet:
               path: /
               port: 80
             initialDelaySeconds: 10
             periodSeconds: 5
           livenessProbe:
             httpGet:
               path: /
               port: 80
             initialDelaySeconds: 20
             periodSeconds: 15
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: adalalegalis-frontend
     namespace: adalalegalis
   spec:
     selector:
       app: adalalegalis-frontend
     ports:
     - port: 80
       targetPort: 80
     type: ClusterIP
   ```

5. أنشئ ملف `kubernetes/ml-deployment.yaml`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: adalalegalis-ml
     namespace: adalalegalis
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: adalalegalis-ml
     template:
       metadata:
         labels:
           app: adalalegalis-ml
       spec:
         containers:
         - name: ml
           image: gcr.io/PROJECT_ID/adalalegalis-ml:latest
           ports:
           - containerPort: 5000
           resources:
             requests:
               cpu: "200m"
               memory: "512Mi"
             limits:
               cpu: "1000m"
               memory: "1Gi"
           readinessProbe:
             httpGet:
               path: /api/health
               port: 5000
             initialDelaySeconds: 30
             periodSeconds: 10
           livenessProbe:
             httpGet:
               path: /api/health
               port: 5000
             initialDelaySeconds: 60
             periodSeconds: 20
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: adalalegalis-ml
     namespace: adalalegalis
   spec:
     selector:
       app: adalalegalis-ml
     ports:
     - port: 80
       targetPort: 5000
     type: ClusterIP
   ```

6. أنشئ ملف `kubernetes/ingress.yaml`:
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: adalalegalis-ingress
     namespace: adalalegalis
     annotations:
       kubernetes.io/ingress.class: "gce"
       kubernetes.io/ingress.global-static-ip-name: "adalalegalis-ip"
       networking.gke.io/managed-certificates: "adalalegalis-certificate"
   spec:
     rules:
     - host: www.adalalegalis.com
       http:
         paths:
         - path: /api
           pathType: Prefix
           backend:
             service:
               name: adalalegalis-backend
               port:
                 number: 80
         - path: /ml-api
           pathType: Prefix
           backend:
             service:
               name: adalalegalis-ml
               port:
                 number: 80
         - path: /
           pathType: Prefix
           backend:
             service:
               name: adalalegalis-frontend
               port:
                 number: 80
   ```

7. أنشئ ملف `kubernetes/certificate.yaml`:
   ```yaml
   apiVersion: networking.gke.io/v1
   kind: ManagedCertificate
   metadata:
     name: adalalegalis-certificate
     namespace: adalalegalis
   spec:
     domains:
     - www.adalalegalis.com
     - adalalegalis.com
   ```

8. أنشئ ملف `kubernetes/secrets.yaml`:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: db-credentials
     namespace: adalalegalis
   type: Opaque
   data:
     host: BASE64_ENCODED_DB_HOST
     username: BASE64_ENCODED_DB_USERNAME
     password: BASE64_ENCODED_DB_PASSWORD
     database: BASE64_ENCODED_DB_NAME
   ---
   apiVersion: v1
   kind: Secret
   metadata:
     name: app-secrets
     namespace: adalalegalis
   type: Opaque
   data:
     jwt-secret: BASE64_ENCODED_JWT_SECRET
   ```
   
   استبدل `BASE64_ENCODED_*` بالقيم المشفرة بـ Base64 المناسبة.

### نشر التطبيق على GKE

1. قم بتكوين gcloud CLI للمشروع:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   gcloud config set compute/zone us-central1-a
   ```

2. احصل على بيانات اعتماد المجموعة:
   ```bash
   gcloud container clusters get-credentials adalalegalis-cluster
   ```

3. قم بإنشاء مساحة الأسماء:
   ```bash
   kubectl apply -f kubernetes/namespace.yaml
   ```

4. قم بإنشاء الأسرار:
   ```bash
   kubectl apply -f kubernetes/secrets.yaml
   ```

5. قم بإنشاء عنوان IP ثابت:
   ```bash
   gcloud compute addresses create adalalegalis-ip --global
   ```

6. قم بنشر التطبيق:
   ```bash
   kubectl apply -f kubernetes/backend-deployment.yaml
   kubectl apply -f kubernetes/frontend-deployment.yaml
   kubectl apply -f kubernetes/ml-deployment.yaml
   kubectl apply -f kubernetes/certificate.yaml
   kubectl apply -f kubernetes/ingress.yaml
   ```

7. تحقق من حالة النشر:
   ```bash
   kubectl get pods -n adalalegalis
   kubectl get services -n adalalegalis
   kubectl get ingress -n adalalegalis
   ```

## إعداد Cloud SQL لقاعدة البيانات

### إنشاء مثيل Cloud SQL

1. انتقل إلى "SQL" في لوحة تحكم Google Cloud.
2. انقر على "إنشاء مثيل".
3. اختر "MySQL".
4. أدخل معرف المثيل: `adalalegalis-db`.
5. عيّن كلمة مرور لمستخدم الجذر.
6. اختر المنطقة: `us-central1`.
7. اختر الإصدار: MySQL 8.0.
8. تكوين الآلة:
   - نوع الآلة: `db-n1-standard-1` (1 vCPU، 3.75 GB ذاكرة)
   - سعة التخزين: 10 GB (قابل للزيادة تلقائياً)
9. انقر على "إنشاء".

### تكوين الاتصال الآمن

1. انتقل إلى مثيل قاعدة البيانات.
2. انتقل إلى "الاتصالات".
3. انقر على "إضافة شبكة".
4. أضف نطاق IP لمجموعة Kubernetes:
   - اسم: `gke-cluster`
   - نطاق عناوين IP: نطاق عناوين IP لمجموعة Kubernetes (يمكنك الحصول عليه من "VPC Network" > "شبكات VPC" > "adalalegalis-network" > "adalalegalis-subnet")
5. انقر على "تم".

### إنشاء قاعدة البيانات والمستخدم

1. انتقل إلى مثيل قاعدة البيانات.
2. انقر على "قواعد البيانات".
3. انقر على "إنشاء قاعدة بيانات".
4. أدخل اسم قاعدة البيانات: `adalalegalis`.
5. انقر على "إنشاء".
6. انتقل إلى "المستخدمون".
7. انقر على "إضافة حساب مستخدم".
8. أدخل اسم المستخدم: `adalalegalis_user`.
9. أدخل كلمة مرور قوية.
10. انقر على "إضافة".

### تكوين النسخ الاحتياطي والاستعادة

1. انتقل إلى مثيل قاعدة البيانات.
2. انتقل إلى "النسخ الاحتياطي".
3. انقر على "تكوين النسخ الاحتياطي التلقائي".
4. حدد "تمكين النسخ الاحتياطي التلقائي".
5. اختر وقت بدء النسخ الاحتياطي: 02:00 UTC.
6. حدد "تمكين النسخ الاحتياطي الثانوي" للتعافي من الكوارث.
7. انقر على "حفظ".

### تكوين مراقبة قاعدة البيانات

1. انتقل إلى مثيل قاعدة البيانات.
2. انتقل إلى "المراقبة".
3. انقر على "تكوين التنبيهات".
4. أضف تنبيهات لـ:
   - استخدام وحدة المعالجة المركزية العالي
   - استخدام الذاكرة العالي
   - استخدام التخزين العالي
   - عدد الاتصالات العالي
5. أدخل عناوين البريد الإلكتروني لتلقي التنبيهات.
6. انقر على "حفظ".

## تكوين النطاق وشهادات SSL

### تسجيل النطاق (إذا لم يكن مسجلاً بالفعل)

1. استخدم مسجل نطاقات مثل Google Domains أو Namecheap لتسجيل النطاق `adalalegalis.com`.
2. قم بتكوين إعدادات النطاق الأساسية.

### تكوين DNS للنطاق

1. احصل على عنوان IP الخارجي للـ Ingress:
   ```bash
   kubectl get ingress adalalegalis-ingress -n adalalegalis
   ```

2. انتقل إلى إعدادات DNS لنطاقك.
3. أضف سجلات A التالية:
   - `adalalegalis.com` -> عنوان IP الخارجي
   - `www.adalalegalis.com` -> عنوان IP الخارجي

### تكوين شهادات SSL

شهادات SSL تُدار تلقائياً بواسطة Google Kubernetes Engine من خلال `ManagedCertificate` الذي قمنا بإنشائه سابقاً.

1. تحقق من حالة الشهادة:
   ```bash
   kubectl describe managedcertificate adalalegalis-certificate -n adalalegalis
   ```

2. انتظر حتى تصبح الشهادة جاهزة (قد يستغرق ذلك حتى 24 ساعة).

## إعداد المراقبة والتنبيهات

### تكوين Cloud Monitoring

1. انتقل إلى "Monitoring" في لوحة تحكم Google Cloud.
2. انقر على "لوحات المعلومات".
3. انقر على "إنشاء لوحة معلومات".
4. أضف مخططات لـ:
   - استخدام وحدة المعالجة المركزية لكل نشر
   - استخدام الذاكرة لكل نشر
   - عدد الطلبات لكل خدمة
   - زمن استجابة الخدمة
   - معدل الأخطاء
5. انقر على "حفظ".

### تكوين Cloud Logging

1. انتقل إلى "Logging" في لوحة تحكم Google Cloud.
2. انقر على "مستكشف السجلات".
3. أنشئ استعلامات لـ:
   - سجلات الخطأ من نشر الخلفية
   - سجلات الخطأ من نشر الواجهة الأمامية
   - سجلات الخطأ من نشر خدمة التعلم الآلي
4. انقر على "حفظ استعلام".

### إعداد تنبيهات المراقبة

1. انتقل إلى "Monitoring" > "التنبيهات".
2. انقر على "إنشاء سياسة".
3. أضف شروط التنبيه لـ:
   - استخدام وحدة المعالجة المركزية > 80%
   - استخدام الذاكرة > 80%
   - معدل الأخطاء > 5%
   - زمن استجابة الخدمة > 2 ثانية
4. أضف قنوات الإخطار:
   - البريد الإلكتروني
   - SMS (إذا كان متاحاً)
   - Slack (إذا كان متاحاً)
5. انقر على "حفظ".

### إعداد لوحة معلومات مخصصة

1. انتقل إلى "Monitoring" > "لوحات المعلومات".
2. انقر على "إنشاء لوحة معلومات".
3. أضف مخططات لـ:
   - عدد المستخدمين النشطين
   - عدد النشاطات التجارية النشطة
   - عدد العقود المنشأة
   - عدد المستندات المحللة
   - أداء خدمة التعلم الآلي
4. انقر على "حفظ".

## إدارة الإصدارات والنشر

### إنشاء إصدار جديد

1. قم بتحديث رقم الإصدار في ملفات المشروع:
   - `package.json` في الخلفية والواجهة الأمامية
   - `version.py` في خدمة التعلم الآلي

2. قم بإنشاء علامة Git جديدة:
   ```bash
   git tag -a v1.0.0 -m "الإصدار 1.0.0"
   git push origin v1.0.0
   ```

3. انتقل إلى "Releases" في مستودع GitHub.
4. انقر على "Draft a new release".
5. اختر العلامة التي أنشأتها.
6. أدخل عنوان الإصدار: `الإصدار 1.0.0`.
7. أضف ملاحظات الإصدار التي تصف التغييرات والميزات الجديدة.
8. انقر على "Publish release".

هذا سيؤدي تلقائياً إلى تشغيل سير عمل `deploy-prod.yml` الذي قمنا بإعداده سابقاً.

### مراقبة عملية النشر

1. انتقل إلى "Actions" في مستودع GitHub.
2. انقر على سير العمل `Deploy to Production` الذي تم تشغيله.
3. راقب التقدم والتأكد من نجاح جميع الخطوات.

4. تحقق من النشر في GKE:
   ```bash
   kubectl get pods -n adalalegalis
   kubectl get services -n adalalegalis
   kubectl get ingress -n adalalegalis
   ```

5. تحقق من الوصول إلى التطبيق عبر المتصفح:
   - `https://www.adalalegalis.com`

### إجراء النشر التدريجي

للإصدارات المهمة، يمكنك استخدام استراتيجية النشر التدريجي:

1. أنشئ ملف `kubernetes/backend-canary.yaml`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: adalalegalis-backend-canary
     namespace: adalalegalis
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: adalalegalis-backend
         version: canary
     template:
       metadata:
         labels:
           app: adalalegalis-backend
           version: canary
       spec:
         containers:
         - name: backend
           image: gcr.io/PROJECT_ID/adalalegalis-backend:NEW_VERSION
           # باقي التكوين مثل backend-deployment.yaml
   ```

2. قم بنشر النسخة التجريبية:
   ```bash
   kubectl apply -f kubernetes/backend-canary.yaml
   ```

3. راقب أداء النسخة التجريبية.
4. إذا كان كل شيء على ما يرام، قم بتحديث النسخة الرئيسية:
   ```bash
   kubectl set image deployment/adalalegalis-backend backend=gcr.io/PROJECT_ID/adalalegalis-backend:NEW_VERSION -n adalalegalis
   ```

5. تحقق من التحديث:
   ```bash
   kubectl rollout status deployment/adalalegalis-backend -n adalalegalis
   ```

6. إذا كانت هناك مشكلات، يمكنك التراجع:
   ```bash
   kubectl rollout undo deployment/adalalegalis-backend -n adalalegalis
   ```

## الخلاصة

هذا الدليل يوفر تعليمات مفصلة لإعداد وتكوين GitHub وGoogle Cloud لتطوير ونشر نظام Adalalegalis. باتباع هذه الخطوات، ستكون قادراً على إنشاء بيئة CI/CD كاملة ونشر التطبيق على بنية تحتية قوية وقابلة للتوسع.

للمساعدة أو الاستفسارات، يرجى التواصل مع فريق DevOps على devops@adalalegalis.com.
