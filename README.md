# CRUD Mahasiswa (Frontend + Flask API + MySQL)

Aplikasi CRUD sederhana untuk data mahasiswa dengan arsitektur 3-tier:
- Frontend: HTML, CSS, JavaScript (EC2 Public)
- Backend: Python Flask + PyMySQL (EC2 Private)
- Database: MySQL (Amazon RDS Private)

## Struktur Folder

```
frontend/
  index.html
  styles.css
  app.js

backend/
  app.py
  schema.sql
  .env.example
```

## Database

Gunakan `backend/schema.sql` untuk membuat database dan tabel:
- Database: `mahasiswa_db`
- Tabel: `mahasiswa(id, nama, jurusan, angkatan)`

## Environment Backend

Backend membaca konfigurasi dari environment variable:

```bash
export DB_HOST=your-rds-endpoint.rds.amazonaws.com
export DB_PORT=3306
export DB_NAME=mahasiswa_db
export DB_USER=admin
export DB_PASS=yourpassword
```

## Menjalankan Backend Lokal

Install dependency:

```bash
pip install flask flask-cors pymysql
```

Jalankan:

```bash
python backend/app.py
```

Endpoint utama:
- `GET /mahasiswa`
- `POST /mahasiswa`
- `PUT /mahasiswa/{id}`
- `DELETE /mahasiswa/{id}`

Endpoint `/api/mahasiswa` juga tetap tersedia sebagai kompatibilitas.

## Menjalankan Frontend

Frontend menggunakan relative path:

```js
const API_BASE_URL = '/mahasiswa';
```

Di deployment AWS, endpoint ini diproxy Nginx dari FE EC2 ke private IP BE EC2.

## Deploy AWS

Panduan detail deployment untuk praktikum tersedia di [DEPLOY_AWS.md](DEPLOY_AWS.md).
