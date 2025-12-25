# Firebase Setup - Інструкція з налаштування

## 🔥 Налаштування Firebase

### 1. Створення Firebase проекту

1. Відкрийте [Firebase Console](https://console.firebase.google.com/)
2. Натисніть **"Add project"** або **"Create a project"**
3. Введіть назву проекту (наприклад, "wellness-website")
4. (Опціонально) Увімкніть Google Analytics
5. Натисніть **"Create project"**

### 2. Налаштування Authentication

1. В бічному меню виберіть **"Build" → "Authentication"**
2. Натисніть **"Get started"**
3. Увімкніть провайдери:
   - **Email/Password**: 
     - Натисніть на "Email/Password"
     - Увімкніть перемикач
     - Натисніть "Save"
   - **Google**:
     - Натисніть на "Google"
     - Увімкніть перемикач
     - Введіть email для підтримки
     - Натисніть "Save"

### 3. Створення користувача-адміна

1. Перейдіть на вкладку **"Users"**
2. Натисніть **"Add user"**
3. Введіть email та password
4. Натисніть **"Add user"**

### 4. Налаштування Firestore Database

1. В бічному меню виберіть **"Build" → "Firestore Database"**
2. Натисніть **"Create database"**
3. Виберіть режим:
   - **Production mode** (рекомендовано для продакшену)
   - **Test mode** (для розробки, буде відкритий доступ)
4. Виберіть локацію (найближча до вас)
5. Натисніть **"Enable"**

### 5. Налаштування правил Firestore

Перейдіть на вкладку **"Rules"** та вставте:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all articles and courses
    match /articles/{article} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /courses/{course} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Натисніть **"Publish"**

### 6. Налаштування Storage

1. В бічному меню виберіть **"Build" → "Storage"**
2. Натисніть **"Get started"**
3. Прийміть правила за замовчуванням
4. Виберіть локацію (ту ж, що і для Firestore)
5. Натисніть **"Done"**

### 7. Налаштування правил Storage

Перейдіть на вкладку **"Rules"** та вставте:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /articles/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /courses/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Натисніть **"Publish"**

### 8. Отримання конфігурації Firebase

1. В бічному меню натисніть на іконку шестерні ⚙️
2. Виберіть **"Project settings"**
3. Прокрутіть вниз до **"Your apps"**
4. Натисніть на іконку **Web** (`</>`)
5. Введіть назву додатку (наприклад, "wellness-website")
6. (Опціонально) Увімкніть Firebase Hosting
7. Натисніть **"Register app"**
8. Скопіюйте конфігурацію `firebaseConfig`

### 9. Додавання конфігурації в проект

Конфігурація вже є в `src/firebase/firebase.ts`, але якщо потрібно оновити:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**Для продакшену використовуйте змінні оточення:**

Створіть файл `.env`:

```env
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🔐 Безпека

### Важливі правила:

1. **Ніколи** не публікуйте `.env` файл в git
2. Додайте `.env` в `.gitignore`
3. Для продакшену використовуйте змінні оточення
4. Обмежте доступ до Firebase Console тільки для довірених користувачів
5. Регулярно перевіряйте логи Firebase на підозрілу активність

### Обмеження доступу

Якщо хочете обмежити доступ тільки для конкретних користувачів, оновіть правила Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{article} {
      allow read: if true;
      allow write: if request.auth != null && 
                   request.auth.token.email in [
                     'admin@example.com',
                     'another-admin@example.com'
                   ];
    }
    
    match /courses/{course} {
      allow read: if true;
      allow write: if request.auth != null && 
                   request.auth.token.email in [
                     'admin@example.com',
                     'another-admin@example.com'
                   ];
    }
  }
}
```

## 🚀 Запуск проекту

1. Встановіть залежності:
```bash
npm install
```

2. Запустіть dev сервер:
```bash
npm run dev
```

3. Відкрийте браузер:
```
http://localhost:4321/admin
```

4. Увійдіть використовуючи створені credentials

## 📊 Моніторинг

### Firebase Console

- **Authentication**: Переглядайте користувачів та їх активність
- **Firestore**: Переглядайте та редагуйте дані напряму
- **Storage**: Переглядайте завантажені файли
- **Analytics**: Аналізуйте використання (якщо увімкнено)

## 🆘 Troubleshooting

### Помилка: "Permission denied"

- Перевірте правила Firestore та Storage
- Переконайтеся, що користувач авторизований
- Перевірте email користувача в списку дозволених (якщо використовуєте whitelist)

### Помилка: "Firebase app not initialized"

- Перевірте конфігурацію в `src/firebase/firebase.ts`
- Переконайтеся, що всі ключі правильні

### Помилка: "Upload failed"

- Перевірте правила Storage
- Переконайтеся, що файл не перевищує ліміт розміру
- Перевірте формат файлу (підтримуються: jpg, png, gif, webp)

## 📝 Додаткові ресурси

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Storage Guide](https://firebase.google.com/docs/storage)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Готово! 🎉 Тепер ви можете використовувати адмін-панель!**



