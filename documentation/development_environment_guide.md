# دليل إعداد بيئة التطوير لنظام Adalalegalis

هذا الدليل يقدم شرحاً مفصلاً لإعداد بيئة التطوير الكاملة لنظام Adalalegalis، مع تعليمات خطوة بخطوة لكل مكون من مكونات البيئة.

## جدول المحتويات
1. [إعداد Node.js وNPM](#إعداد-nodejs-وnpm)
2. [إعداد Angular CLI](#إعداد-angular-cli)
3. [إعداد MySQL](#إعداد-mysql)
4. [إعداد بيئة Python للتعلم الآلي](#إعداد-بيئة-python-للتعلم-الآلي)
5. [إعداد Docker وKubernetes](#إعداد-docker-وkubernetes)
6. [إعداد أدوات التطوير المساعدة](#إعداد-أدوات-التطوير-المساعدة)
7. [تكوين بيئة التطوير المتكاملة (IDE)](#تكوين-بيئة-التطوير-المتكاملة-ide)
8. [إعداد بيئة التطوير للفريق](#إعداد-بيئة-التطوير-للفريق)

## إعداد Node.js وNPM

### تثبيت Node.js وNPM على Windows

1. قم بزيارة [موقع Node.js الرسمي](https://nodejs.org/) وتنزيل أحدث إصدار LTS (الإصدار 16.x أو أحدث).
2. قم بتشغيل ملف التثبيت الذي تم تنزيله.
3. اتبع خطوات معالج التثبيت:
   - اقبل اتفاقية الترخيص
   - اختر مجلد التثبيت (يُفضل الإبقاء على المجلد الافتراضي)
   - اختر المكونات للتثبيت (تأكد من تحديد "npm package manager")
   - انقر على "التالي" ثم "تثبيت"
4. افتح موجه الأوامر (Command Prompt) وتحقق من التثبيت:
   ```bash
   node --version
   npm --version
   ```

### تثبيت Node.js وNPM على macOS

#### باستخدام Homebrew (موصى به)
1. قم بتثبيت Homebrew إذا لم يكن مثبتاً بالفعل:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. قم بتثبيت Node.js (يتضمن npm):
   ```bash
   brew install node@16
   ```
3. أضف Node.js إلى متغير PATH:
   ```bash
   echo 'export PATH="/usr/local/opt/node@16/bin:$PATH"' >> ~/.zshrc
   # أو إذا كنت تستخدم bash
   echo 'export PATH="/usr/local/opt/node@16/bin:$PATH"' >> ~/.bash_profile
   ```
4. أعد تحميل ملف التكوين:
   ```bash
   source ~/.zshrc
   # أو
   source ~/.bash_profile
   ```

#### باستخدام المثبت
1. قم بزيارة [موقع Node.js الرسمي](https://nodejs.org/) وتنزيل أحدث إصدار LTS لنظام macOS.
2. قم بتشغيل ملف التثبيت واتبع التعليمات.

### تثبيت Node.js وNPM على Ubuntu/Debian

1. قم بتحديث قائمة الحزم:
   ```bash
   sudo apt update
   ```
2. قم بتثبيت Node.js وnpm باستخدام NodeSource:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. تحقق من التثبيت:
   ```bash
   node --version
   npm --version
   ```

### تثبيت Node.js وNPM على Red Hat/Fedora/CentOS

1. قم بتثبيت Node.js وnpm باستخدام NodeSource:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   ```
2. تحقق من التثبيت:
   ```bash
   node --version
   npm --version
   ```

### تكوين NPM للمشروع

1. قم بإنشاء ملف `.npmrc` في المجلد الرئيسي للمستخدم لتكوين إعدادات npm العامة:
   ```bash
   echo "save-exact=true" > ~/.npmrc
   echo "fund=false" >> ~/.npmrc
   ```
   هذا سيضمن تثبيت الإصدارات المحددة من الحزم ويمنع رسائل التمويل.

2. قم بتكوين npm للمشروع:
   ```bash
   cd /path/to/adalalagalisv16
   npm config set legacy-peer-deps true
   ```
   هذا ضروري لحل مشكلات التوافق مع بعض حزم Angular.

## إعداد Angular CLI

### تثبيت Angular CLI

بعد تثبيت Node.js وnpm، قم بتثبيت Angular CLI عالمياً:

```bash
npm install -g @angular/cli@14
```

تحقق من التثبيت:

```bash
ng version
```

يجب أن ترى معلومات حول إصدار Angular CLI المثبت (الإصدار 14.x).

### تكوين Angular CLI

1. قم بإنشاء ملف تكوين Angular CLI في المجلد الرئيسي للمستخدم:
   ```bash
   ng config -g cli.packageManager npm
   ng config -g cli.analytics false
   ```
   هذا يعين npm كمدير حزم ويعطل تحليلات Angular CLI.

2. قم بتكوين Angular CLI للمشروع:
   ```bash
   cd /path/to/adalalagalisv16/frontend
   ng config cli.defaultCollection @angular/material
   ```
   هذا يعين Angular Material كمجموعة افتراضية للمولدات.

### استخدام Angular Schematics

Angular CLI يوفر أداة Schematics لإنشاء مكونات وخدمات وغيرها. لإنشاء مكون جديد:

```bash
cd /path/to/adalalagalisv16/frontend
ng generate component features/new-feature
```

لإنشاء خدمة جديدة:

```bash
ng generate service core/services/new-service
```

## إعداد MySQL

### تثبيت MySQL على Windows

1. قم بتنزيل [MySQL Installer](https://dev.mysql.com/downloads/installer/) من الموقع الرسمي.
2. قم بتشغيل المثبت واختر "Developer Default" للتثبيت الكامل.
3. اتبع معالج التثبيت:
   - اختر "Standalone MySQL Server"
   - اختر "Development Computer" كنوع التكوين
   - عيّن كلمة مرور قوية لمستخدم الجذر (root)
   - اختر "Start MySQL at System Startup" لبدء MySQL تلقائياً
   - أكمل التثبيت

4. تحقق من التثبيت بفتح MySQL Command Line Client وإدخال كلمة المرور.

### تثبيت MySQL على macOS

#### باستخدام Homebrew (موصى به)
1. قم بتثبيت MySQL:
   ```bash
   brew install mysql@8.0
   ```
2. ابدأ خدمة MySQL:
   ```bash
   brew services start mysql
   ```
3. قم بتأمين التثبيت:
   ```bash
   mysql_secure_installation
   ```
   اتبع التعليمات لتعيين كلمة مرور لمستخدم الجذر وتكوين إعدادات الأمان.

### تثبيت MySQL على Ubuntu/Debian

1. قم بتحديث قائمة الحزم:
   ```bash
   sudo apt update
   ```
2. قم بتثبيت MySQL:
   ```bash
   sudo apt install mysql-server
   ```
3. قم بتأمين التثبيت:
   ```bash
   sudo mysql_secure_installation
   ```
   اتبع التعليمات لتعيين كلمة مرور لمستخدم الجذر وتكوين إعدادات الأمان.

### تثبيت MySQL على Red Hat/Fedora/CentOS

1. قم بتثبيت مستودع MySQL:
   ```bash
   sudo rpm -Uvh https://repo.mysql.com/mysql80-community-release-el7-3.noarch.rpm
   sudo yum install mysql-server
   ```
2. ابدأ خدمة MySQL:
   ```bash
   sudo systemctl start mysqld
   sudo systemctl enable mysqld
   ```
3. احصل على كلمة المرور المؤقتة:
   ```bash
   sudo grep 'temporary password' /var/log/mysqld.log
   ```
4. قم بتأمين التثبيت:
   ```bash
   sudo mysql_secure_installation
   ```

### إعداد قاعدة بيانات المشروع

1. قم بتسجيل الدخول إلى MySQL:
   ```bash
   mysql -u root -p
   ```
   أدخل كلمة المرور التي قمت بتعيينها.

2. قم بإنشاء قاعدة البيانات والمستخدم:
   ```sql
   CREATE DATABASE adalalegalis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'adalalegalis_user'@'localhost' IDENTIFIED BY 'your_strong_password';
   GRANT ALL PRIVILEGES ON adalalegalis.* TO 'adalalegalis_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. قم بتعديل ملف التكوين في `/backend/src/config/database.js` لاستخدام بيانات الاعتماد الصحيحة.

### تثبيت MySQL Workbench (اختياري)

MySQL Workbench هي أداة رسومية لإدارة قواعد البيانات MySQL.

1. قم بتنزيل [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) من الموقع الرسمي.
2. قم بتثبيت الأداة باتباع التعليمات.
3. قم بتشغيل MySQL Workbench وإنشاء اتصال جديد:
   - اسم الاتصال: Adalalegalis Local
   - طريقة الاتصال: Standard (TCP/IP)
   - المضيف: localhost
   - المنفذ: 3306
   - اسم المستخدم: root
   - كلمة المرور: كلمة المرور التي قمت بتعيينها

## إعداد بيئة Python للتعلم الآلي

### تثبيت Python

#### على Windows
1. قم بتنزيل [Python](https://www.python.org/downloads/) (الإصدار 3.8 أو أحدث).
2. قم بتشغيل المثبت:
   - حدد "Add Python to PATH"
   - اختر "Install Now"
3. تحقق من التثبيت:
   ```bash
   python --version
   pip --version
   ```

#### على macOS
1. باستخدام Homebrew:
   ```bash
   brew install python
   ```
2. تحقق من التثبيت:
   ```bash
   python3 --version
   pip3 --version
   ```

#### على Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### إعداد بيئة افتراضية

البيئات الافتراضية تساعد في عزل تبعيات المشروع عن النظام العام.

1. انتقل إلى مجلد ML:
   ```bash
   cd /path/to/adalalagalisv16/ml
   ```

2. أنشئ بيئة افتراضية:
   ```bash
   # على Windows
   python -m venv venv

   # على macOS/Linux
   python3 -m venv venv
   ```

3. قم بتنشيط البيئة الافتراضية:
   ```bash
   # على Windows
   venv\Scripts\activate

   # على macOS/Linux
   source venv/bin/activate
   ```

4. قم بتثبيت التبعيات:
   ```bash
   pip install -r requirements.txt
   ```

### تثبيت مكتبات التعلم الآلي الإضافية

قد تحتاج إلى مكتبات إضافية للتطوير:

```bash
pip install jupyter matplotlib seaborn scikit-learn pandas-profiling
```

### إعداد Jupyter Notebook (اختياري)

Jupyter Notebook مفيد لتطوير واختبار خوارزميات التعلم الآلي:

1. قم بتثبيت Jupyter:
   ```bash
   pip install jupyter
   ```

2. قم بتشغيل Jupyter Notebook:
   ```bash
   jupyter notebook
   ```
   سيفتح متصفحك تلقائياً مع واجهة Jupyter.

3. أنشئ دفتر ملاحظات جديد لاختبار الشيفرة.

## إعداد Docker وKubernetes

### تثبيت Docker

#### على Windows
1. تأكد من تمكين Hyper-V وخدمات التحويل البرمجي:
   - افتح PowerShell كمسؤول
   - قم بتشغيل:
     ```powershell
     Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
     Enable-WindowsOptionalFeature -Online -FeatureName containers -All
     ```
   - أعد تشغيل الكمبيوتر

2. قم بتنزيل وتثبيت [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop).
3. اتبع معالج التثبيت واختر "Use WSL 2 instead of Hyper-V" إذا كان متاحاً.
4. بعد التثبيت، قم بتشغيل Docker Desktop.

#### على macOS
1. قم بتنزيل وتثبيت [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop).
2. اتبع معالج التثبيت.
3. بعد التثبيت، قم بتشغيل Docker Desktop.

#### على Ubuntu/Debian
```bash
# قم بإزالة أي تثبيت سابق
sudo apt remove docker docker-engine docker.io containerd runc

# قم بتثبيت المتطلبات الأساسية
sudo apt update
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# أضف مفتاح GPG الرسمي لـ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# أضف مستودع Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# قم بتثبيت Docker Engine
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# أضف المستخدم الحالي إلى مجموعة docker
sudo usermod -aG docker $USER
```
قم بتسجيل الخروج وإعادة تسجيل الدخول لتطبيق تغييرات المجموعة.

### تثبيت Docker Compose

#### على Windows/macOS
Docker Compose مضمن مع Docker Desktop.

#### على Linux
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### تثبيت Kubernetes CLI (kubectl)

#### على Windows
1. قم بتنزيل أحدث إصدار من kubectl:
   ```powershell
   curl -LO "https://dl.k8s.io/release/v1.24.0/bin/windows/amd64/kubectl.exe"
   ```
2. أضف المجلد الذي يحتوي على kubectl.exe إلى متغير PATH.

#### على macOS
```bash
brew install kubectl
```

#### على Linux
```bash
curl -LO "https://dl.k8s.io/release/v1.24.0/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### تمكين Kubernetes في Docker Desktop

1. افتح Docker Desktop.
2. انتقل إلى الإعدادات (Settings).
3. انتقل إلى Kubernetes.
4. حدد "Enable Kubernetes" وانقر على "Apply & Restart".
5. انتظر حتى يتم تشغيل Kubernetes (سيظهر مؤشر أخضر).

### تثبيت Minikube (بديل لـ Docker Desktop Kubernetes)

Minikube هو بديل خفيف لتشغيل Kubernetes محلياً.

#### على Windows
```powershell
choco install minikube
```
(يتطلب [Chocolatey](https://chocolatey.org/))

#### على macOS
```bash
brew install minikube
```

#### على Linux
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

### تكوين Kubernetes للمشروع

1. قم بإنشاء مساحة أسماء للمشروع:
   ```bash
   kubectl create namespace adalalegalis-dev
   ```

2. قم بتعيين السياق الحالي:
   ```bash
   kubectl config set-context --current --namespace=adalalegalis-dev
   ```

3. تحقق من التكوين:
   ```bash
   kubectl config view
   ```

## إعداد أدوات التطوير المساعدة

### تثبيت Git

#### على Windows
1. قم بتنزيل وتثبيت [Git for Windows](https://gitforwindows.org/).
2. اختر الخيارات التالية أثناء التثبيت:
   - استخدام Git من موجه الأوامر في Windows
   - استخدام OpenSSH
   - استخدام OpenSSL للشهادات
   - تحويل نهايات السطور إلى النمط المناسب للنظام
   - استخدام MinTTY كمحطة طرفية

#### على macOS
```bash
brew install git
```

#### على Linux
```bash
sudo apt update
sudo apt install git
```

### تكوين Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.autocrlf input
```

### تثبيت Postman

[Postman](https://www.postman.com/downloads/) هو أداة مفيدة لاختبار واجهات برمجة التطبيقات (APIs).

1. قم بتنزيل وتثبيت Postman من الموقع الرسمي.
2. قم بإنشاء مجموعة جديدة (Collection) للمشروع.
3. قم بإنشاء بيئة (Environment) للتطوير المحلي مع المتغيرات التالية:
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (سيتم ملؤه تلقائياً بعد تسجيل الدخول)

### تثبيت Redis (اختياري)

Redis مفيد للتخزين المؤقت وإدارة الجلسات.

#### على Windows
استخدم WSL2 (Windows Subsystem for Linux) لتثبيت Redis:
1. قم بتثبيت WSL2 باتباع [التعليمات الرسمية](https://docs.microsoft.com/en-us/windows/wsl/install).
2. افتح محطة طرفية WSL وقم بتثبيت Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

#### على macOS
```bash
brew install redis
brew services start redis
```

#### على Linux
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
```

## تكوين بيئة التطوير المتكاملة (IDE)

### Visual Studio Code

[Visual Studio Code](https://code.visualstudio.com/) هو IDE موصى به لتطوير Adalalegalis.

#### تثبيت الإضافات المفيدة

1. **Angular Language Service**: لدعم Angular
2. **ESLint**: للتحقق من جودة الشيفرة JavaScript/TypeScript
3. **Prettier**: لتنسيق الشيفرة
4. **MySQL**: لدعم MySQL
5. **Python**: لدعم Python
6. **Docker**: لدعم Docker
7. **Kubernetes**: لدعم Kubernetes
8. **GitLens**: لتحسين تكامل Git
9. **Arabic Language Pack**: لدعم اللغة العربية

#### تكوين VS Code للمشروع

1. قم بإنشاء مجلد `.vscode` في جذر المشروع.
2. أنشئ ملف `settings.json` داخل المجلد:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "eslint.validate": ["javascript", "typescript"],
     "typescript.tsdk": "frontend/node_modules/typescript/lib",
     "files.eol": "\n",
     "files.encoding": "utf8",
     "[typescript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[javascript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[html]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[scss]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[json]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "python.linting.enabled": true,
     "python.linting.pylintEnabled": true,
     "python.formatting.provider": "black",
     "python.formatting.blackArgs": ["--line-length", "88"],
     "python.venvPath": "${workspaceFolder}/ml/venv",
     "python.defaultInterpreterPath": "${workspaceFolder}/ml/venv/bin/python"
   }
   ```

3. أنشئ ملف `extensions.json` لتوصية الإضافات:
   ```json
   {
     "recommendations": [
       "angular.ng-template",
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "ms-azuretools.vscode-docker",
       "ms-kubernetes-tools.vscode-kubernetes-tools",
       "ms-python.python",
       "ms-vscode.vscode-typescript-next",
       "eamodio.gitlens",
       "cweijan.vscode-mysql-client2"
     ]
   }
   ```

### WebStorm (بديل)

إذا كنت تفضل استخدام [WebStorm](https://www.jetbrains.com/webstorm/):

1. قم بتنزيل وتثبيت WebStorm.
2. قم بتثبيت الإضافات التالية:
   - Angular
   - ESLint
   - Prettier
   - Docker
   - Kubernetes
   - Database Navigator

## إعداد بيئة التطوير للفريق

### إعداد ESLint وPrettier

1. تأكد من تثبيت ESLint وPrettier في مشروع الواجهة الأمامية:
   ```bash
   cd /path/to/adalalagalisv16/frontend
   npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
   ```

2. أنشئ ملف `.eslintrc.json` في مجلد الواجهة الأمامية:
   ```json
   {
     "root": true,
     "ignorePatterns": ["projects/**/*"],
     "overrides": [
       {
         "files": ["*.ts"],
         "parserOptions": {
           "project": ["tsconfig.json"],
           "createDefaultProgram": true
         },
         "extends": [
           "plugin:@angular-eslint/recommended",
           "plugin:@angular-eslint/template/process-inline-templates",
           "plugin:prettier/recommended"
         ],
         "rules": {
           "@angular-eslint/directive-selector": [
             "error",
             {
               "type": "attribute",
               "prefix": "app",
               "style": "camelCase"
             }
           ],
           "@angular-eslint/component-selector": [
             "error",
             {
               "type": "element",
               "prefix": "app",
               "style": "kebab-case"
             }
           ]
         }
       },
       {
         "files": ["*.html"],
         "extends": ["plugin:@angular-eslint/template/recommended"],
         "rules": {}
       }
     ]
   }
   ```

3. أنشئ ملف `.prettierrc` في مجلد الواجهة الأمامية:
   ```json
   {
     "singleQuote": true,
     "trailingComma": "es5",
     "printWidth": 100,
     "semi": true,
     "bracketSpacing": true,
     "arrowParens": "avoid",
     "endOfLine": "lf"
   }
   ```

### إعداد Husky وlint-staged

Husky وlint-staged يساعدان في تنفيذ فحوصات الجودة قبل الالتزام (commit).

1. قم بتثبيت Husky وlint-staged:
   ```bash
   cd /path/to/adalalagalisv16
   npm install --save-dev husky lint-staged
   ```

2. قم بتهيئة Husky:
   ```bash
   npx husky install
   npm set-script prepare "husky install"
   ```

3. أنشئ خطاف pre-commit:
   ```bash
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

4. أنشئ ملف `.lintstagedrc.json` في جذر المشروع:
   ```json
   {
     "frontend/**/*.{ts,html,scss,json}": ["cd frontend && npx prettier --write"],
     "frontend/**/*.ts": ["cd frontend && npx eslint --fix"],
     "backend/**/*.js": ["cd backend && npx eslint --fix"],
     "ml/**/*.py": ["cd ml && python -m black"]
   }
   ```

### إعداد التوثيق التلقائي

1. قم بتثبيت Compodoc للواجهة الأمامية:
   ```bash
   cd /path/to/adalalagalisv16/frontend
   npm install --save-dev @compodoc/compodoc
   ```

2. أضف سكريبت إلى `package.json`:
   ```json
   "scripts": {
     "docs": "compodoc -p tsconfig.json -s"
   }
   ```

3. قم بتثبيت JSDoc للخلفية:
   ```bash
   cd /path/to/adalalagalisv16/backend
   npm install --save-dev jsdoc
   ```

4. أنشئ ملف `jsdoc.json` في مجلد الخلفية:
   ```json
   {
     "source": {
       "include": ["src"],
       "includePattern": ".+\\.js(doc|x)?$",
       "excludePattern": "(node_modules/|docs)"
     },
     "plugins": ["plugins/markdown"],
     "templates": {
       "cleverLinks": true,
       "monospaceLinks": true
     },
     "opts": {
       "destination": "./docs/",
       "recurse": true,
       "readme": "README.md"
     }
   }
   ```

5. أضف سكريبت إلى `package.json`:
   ```json
   "scripts": {
     "docs": "jsdoc -c jsdoc.json"
   }
   ```

### إعداد سير العمل للفريق

1. أنشئ ملف `CONTRIBUTING.md` في جذر المشروع لتوثيق إرشادات المساهمة.
2. أنشئ ملف `PULL_REQUEST_TEMPLATE.md` في مجلد `.github` لتوحيد طلبات السحب.
3. أنشئ قوالب للمشكلات في مجلد `.github/ISSUE_TEMPLATE`.

## الخلاصة

هذا الدليل يوفر تعليمات مفصلة لإعداد بيئة تطوير كاملة لنظام Adalalegalis. باتباع هذه الخطوات، ستكون قادراً على تطوير وتشغيل واختبار جميع مكونات النظام محلياً.

للمساعدة أو الاستفسارات، يرجى التواصل مع فريق التطوير على dev-support@adalalegalis.com.
