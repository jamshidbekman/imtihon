# NestJS va TypeORM loyiha imtihoni

## Loyiha mavzusi: O'quv platforma tizimi (StudyHUB)

Bu o'quv platformasi o'qituvchilar va o'quvchilar uchun kurslarni boshqarish, vazifalarni topshirish va baholash imkoniyatlarini taqdim etadi.

### Texnologiyalar

- NestJS framework
- TypeORM
- PostgreSQL/MySQL database
- JWT autentifikatsiya
- SMS va Email verifikatsiya
- Guards (Auth guards, Role guards)

### Tizim modullari va endpointlari

#### 1. Autentifikatsiya moduli (Auth Module)

**1.1. Ro'yxatdan o'tish**

- **Endpoint:** `POST /api/auth/register` ✔️
- **Request body:**
  ```json
  {
    "fullName": "string (3-50 belgili)",
    "email": "string (email format)",
    "password": "string (8-20 belgili, kamida 1 raqam, 1 katta harf)",
    "phoneNumber": "string (telefon raqam formati)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Ro'yxatdan o'tish muvaffaqiyatli amalga oshirildi. Iltimos, telefoningizga yuborilgan kodni tasdiqlang.",
    "userId": "uuid"
  }
  ```

**1.2. SMS orqali verifikatsiya**

- **Endpoint:** `POST /api/auth/verify-sms`✔️
- **Request body:**
  ```json
  {
    "phone_number": "string",
    "code": "string (6 raqamli kod)"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Telefon raqam tasdiqlandi. Endi email manzilingizni tasdiqlashingiz kerak."
  }
  ```

**1.3. Email orqali verifikatsiya**
//bu yerda emailga sorov ketadi "http://localhost/api/auth/verify-email/:token" va user saytga bosganda tasdiqlanadi

- **Endpoint:** `GET /api/auth/verify-email/:token` ✔️
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email manzil tasdiqlandi. Endi tizimga kirishingiz mumkin."
  }
  ```

**1.4. Tizimga kirish**

- **Endpoint:** `POST /api/auth/login`✔️
- **Request body:**
  ```json
  {
    "email": "string (email format)",
    "password": "string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "accessToken": "string (JWT token)",
    "refreshToken": "string (JWT refresh token)",
    "user": {
      "id": "uuid",
      "fullName": "string",
      "phoneNumber": "+998987654321",
      "email": "string",
      "role": "string (STUDENT/TEACHER)",
      "isVerified": true
    }
  }
  ```

#### 2. Foydalanuvchi profili moduli (User Module)

**2.1. Profil ma'lumotlarini olish**

- **Endpoint:** `GET /api/users/profile`
- **Headers:** `Authorization: Bearer {token}`✔️
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "role": "string (STUDENT/TEACHER)",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

**2.2. Profil ma'lumotlarini yangilash**

- **Endpoint:** `PATCH /api/users/profile` ✔️
- **Headers:** `Authorization: Bearer {token}`
- **Request body:**
  ```json
  {
    "fullName": "string (ixtiyoriy)",
    "phoneNumber": "string (ixtiyoriy)"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profil ma'lumotlari muvaffaqiyatli yangilandi",
    "user": {
      "id": "uuid",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "updatedAt": "date"
    }
  }
  ```

#### 3. Kurslar moduli (Courses Module)

**3.1. Kurslarni ro'yxatini olish**

- **Endpoint:** `GET /api/courses`
- **Headers:** `Authorization: Bearer {token}` ✔️
- **Query parameters:**
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (ixtiyoriy)
- **Response (200 OK):**

  ```json
  {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "teacherId": "uuid",
        "teacherName": "string",
        "studentsCount": "number",
        "createdAt": "date"
      }
    ]
  }
  ```

**3.2. Kurs ma'lumotlarini olish**

- **Endpoint:** `GET /api/courses/:id`
- **Headers:** `Authorization: Bearer {token}`❌
- **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "teacherId": "uuid",
    "teacherName": "string",
    "materials": [
      {
        "id": "uuid",
        "title": "string",
        "fileUrl": "string",
        "createdAt": "date"
      }
    ],
    "assignments": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "dueDate": "date",
        "maxScore": "number"
      }
    ],
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

**3.3. Kurs yaratish (faqat o'qituvchilar uchun)**

- **Endpoint:** `POST /api/courses`✔️
- **Headers:** `Authorization: Bearer {token}`
- **Guard:** `RoleGuard (TEACHER)`
- **Request body:**

  ```json
  {
    "title": "string (5-100 belgili)",
    "description": "string (20-1000 belgili)"
  }
  ```

- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Kurs muvaffaqiyatli yaratildi",
    "course": {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "teacherId": "uuid",
      "createdAt": "date"
    }
  }
  ```

#### 4. Vazifalar moduli (Assignments Module)

**4.1. Vazifa yaratish (faqat o'qituvchilar uchun)**

- **Endpoint:** `POST /api/courses/:courseId/assignments`
- **Headers:** `Authorization: Bearer {token}`
- **Guard:** `RoleGuard (TEACHER) + CourseOwnerGuard`
- **Request body:**
  ```json
  {
    "title": "string (5-100 belgili)",
    "description": "string (20-1000 belgili)",
    "dueDate": "date (ISO format)",
    "maxScore": "number (1-100)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Vazifa muvaffaqiyatli yaratildi",
    "assignment": {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "dueDate": "date",
      "maxScore": "number",
      "courseId": "uuid",
      "createdAt": "date"
    }
  }
  ```

**4.2. Vazifani topshirish (faqat o'quvchilar uchun)**

- **Endpoint:** `POST /api/assignments/:assignmentId/submissions`
- **Headers:** `Authorization: Bearer {token}`
- **Guard:** `RoleGuard (STUDENT) + CourseEnrolledGuard`
- **Request body (multipart/form-data):**
  ```
  description: "string (izoh, ixtiyoriy)",
  file: File (max 10MB, pdf/doc/docx formatlari)
  ```
- **Response (201 Created):**

  ```json
  {
    "success": true,
    "message": "Vazifa muvaffaqiyatli topshirildi",
    "submission": {
      "id": "uuid",
      "description": "string",
      "fileUrl": "string",
      "status": "SUBMITTED",
      "score": 89,
      "assignmentId": "uuid",
      "studentId": "uuid",
      "createdAt": "date"
    }
  }
  ```

## Texnik talablar va ko'rsatmalar

1. **Entity (Model) larni yaratish**:✔️

   - User entity (id, fullName, email, password, phoneNumber, role, isEmailVerified, isPhoneVerified, ...)✔️
   - Course entity (id, title, description, teacherId, ...)✔️
   - Assignment entity (id, title, description, dueDate, maxScore, courseId, ...)✔️
   - Submission entity (id, description, fileUrl, status, score, assignmentId, studentId, ...)✔️
   - Va h.k.

2. **DTO (Data Transfer Object) larni yaratish**: ✔️

   - Har bir endpoint uchun Request DTO
   - Har bir endpoint uchun Response DTO
   - Validatsiya uchun class-validator dekoratorlaridan foydalanish

3. **Guards yaratish**:

   - AuthGuard (JWT token tekshirish) ✔️
   - RoleGuard (foydalanuvchi rolini tekshirish) ✔️
   - CourseOwnerGuard (kurs egasi tekshirish)
   - CourseEnrolledGuard (kursga a'zolikni tekshirish)

4. **SMS va Email verifikatsiya**: ✔️

   - SMS yuborish uchun service yaratish (mock qilsa ham bo'ladi)
   - Email yuborish uchun service yaratish (mock qilsa ham bo'ladi)
   - Verifikatsiya kodlarini saqlash va tekshirish

5. **Xatoliklarni qayta ishlash**:

   - Global exception filter yaratish
   - HTTP status kodlarini to'g'ri ishlatish
   - Xatolar uchun standart formatda javob qaytarish

## Baholash mezonlari

1. **Kod sifati va tuzilishi (40%)**:✔️

   - NestJS arxitekturasi va best practices ga rioya qilish✔️
   - TypeORM dan to'g'ri foydalanish ✔️
   - Clean code prinsiplarini qo'llash ✔️

2. **Funksionallik (30%)**:

   - Barcha endpointlar to'g'ri ishlashi
   - Guards to'g'ri ishlashi ✔️
   - SMS va Email verifikatsiya to'g'ri ishlashi✔️

3. **Xatoliklarni qayta ishlash (20%)**:

   - Barcha xatoliklar to'g'ri qayta ishlanishi
   - HTTP status kodlari to'g'ri ishlatilishi

4. **Documentation (10%)**:
   - README.md fayli (o'rnatish va ishlatish yo'riqnomasi)
   - API documentation (Swagger yoki boshqa usulda)

## Taqdim etish tartibi

1. GitHub repositoriyasi yaratish
2. Loyihani tugallangandan so'ng, repositoriya URL manzilini taqdim etish
3. README.md faylida loyiha haqida ma'lumot va uni ishga tushirish uchun ko'rsatmalar berish

Loyiha topshirish muddati: 1 hafta.
