# 🚀 Швидкий старт - Адмін-панель

## За 5 хвилин до першої статті!

### ⚡ Крок 1: Firebase (2 хв)

1. Відкрийте https://console.firebase.google.com/
2. Створіть новий проект або виберіть існуючий
3. Увімкніть:
   - **Authentication** → Email/Password + Google
   - **Firestore Database** → Створіть базу в режимі "Test mode"
   - **Storage** → Увімкніть сховище

### 🔑 Крок 2: Створіть адміна (1 хв)

Firebase Console → Authentication → Users → Add user

```
Email: your-email@example.com
Password: ваш-безпечний-пароль
```

### 🎯 Крок 3: Запустіть сайт (1 хв)

```bash
# В терміналі:
cd C:\Users\Vision\.cursor\worktrees\galactic-giant\ihg
npm install
npm run dev
```

### 🎨 Крок 4: Увійдіть в адмін-панель (1 хв)

1. Відкрийте: http://localhost:4321/admin
2. Введіть email та пароль
3. Натисніть "Sign in"

### ✍️ Крок 5: Додайте першу статтю!

1. Вкладка **"Blog Articles"**
2. Заповніть:
   - Title: Назва вашої статті
   - Excerpt: Короткий опис
   - Content: Текст в Markdown
   - Date: Оберіть дату
   - Image URL: `/images/blog-1.png` (або завантажте своє)
3. **"Save Article"**

**Готово! 🎉**

---

## 📋 Швидкі команди

```bash
# Запуск dev сервера
npm run dev

# Білд для продакшену
npm run build

# Перегляд білду
npm run preview
```

## 🔗 Корисні посилання

- Адмін-панель: http://localhost:4321/admin
- Головна: http://localhost:4321/
- Блог: http://localhost:4321/blog
- Курси: http://localhost:4321/courses

## 📚 Детальна документація

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Повна інструкція
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Детальне налаштування Firebase
- **[ADMIN_PANEL_SUMMARY.md](./ADMIN_PANEL_SUMMARY.md)** - Технічні деталі
- **[seed-data.json](./seed-data.json)** - Приклади контенту

## ⚠️ Важливо

### Firestore Rules (для продакшену)

В Firebase Console → Firestore → Rules вставте:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
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

### Storage Rules

В Firebase Console → Storage → Rules вставте:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🆘 Проблеми?

### Не можу увійти
- Перевірте email та пароль
- Перевірте що користувач створений в Firebase Console
- Перевірте консоль браузера (F12) на помилки

### Не завантажується зображення
- Перевірте що Storage увімкнений
- Перевірте Storage Rules
- Спробуйте використати існуюче зображення з `/images/`

### Помилка Firestore
- Перевірте що Firestore Database створена
- Перевірте Firestore Rules
- Перевірте що Firebase конфігурація правильна

---

**Потрібна допомога?** Перевірте [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) або консоль браузера (F12)

**Все працює?** Насолоджуйтесь створенням контенту! ✨



