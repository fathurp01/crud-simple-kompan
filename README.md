# CRUD Website Kopi (Frontend & Backend Dipisah)

Aplikasi CRUD sederhana untuk data kopi dengan:
- Frontend: HTML, CSS, JavaScript murni
- Backend: PHP murni (tanpa framework)
- Database: MySQL (siap konek ke AWS RDS)

## Struktur Folder

```
frontend/
  index.html
  styles.css
  app.js

backend/
  index.php
  config.php
  schema.sql
  .env.example
  .htaccess
```

## 1) Setup Database (AWS RDS MySQL)

1. Buat RDS MySQL di AWS.
2. Pastikan `Public access` dan `Security Group` mengizinkan koneksi dari server Ubuntu Anda di port `3306`.
3. Buat database, misalnya `kopi_db`.
4. Jalankan SQL pada file `backend/schema.sql`.

## 2) Konfigurasi Backend

Di server Ubuntu, set environment variable berikut:

```bash
export DB_HOST=your-rds-endpoint.rds.amazonaws.com
export DB_PORT=3306
export DB_NAME=kopi_db
export DB_USER=admin
export DB_PASS=yourpassword
```

Catatan penting backend:
- `DB_HOST` isi dengan private endpoint/IP database (contoh endpoint AWS RDS di VPC private).
- Backend saat ini sudah mengembalikan JSON dan mengirim header API di `backend/index.php`:
  - `Content-Type: application/json`
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

## 3) Menjalankan Backend

Masuk ke folder `backend`, jalankan:

```bash
php -S 0.0.0.0:8000
```

API endpoint:
- `GET /api/coffees`
- `GET /api/coffees/{id}`
- `POST /api/coffees`
- `PUT /api/coffees/{id}`
- `DELETE /api/coffees/{id}`

## 4) Menjalankan Frontend

Buka file `frontend/index.html` di browser.

Secara default frontend memanggil relative path (tanpa IP private):

```js
const API_BASE_URL = '/api/coffees';
```

Ini sengaja supaya JavaScript di browser **tidak pernah** memakai IP private backend.

## Test Lokal CRUD (Paling Mudah)

Karena frontend memakai relative path `/api/...`, test lokal paling enak pakai 1 server PHP + router.

1. Set env database di terminal (PowerShell):

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_NAME = "kopi_db"
$env:DB_USER = "root"
$env:DB_PASS = ""
```

2. Import schema ke MySQL lokal:

```powershell
mysql -u root -p kopi_db < .\backend\schema.sql
```

3. Jalankan server dari root project:

```powershell
php -S 127.0.0.1:8080 -t .\frontend .\local-router.php
```

4. Buka browser:

```text
http://127.0.0.1:8080
```

5. Uji CRUD dari form di halaman:
- Create: isi form lalu klik `Simpan`
- Read: data tampil di tabel
- Update: klik `Edit`, ubah data, klik `Update`
- Delete: klik `Hapus`

Opsional cek health API:

```text
http://127.0.0.1:8080/health
```

## 5) Reverse Proxy FE ke BE (Nginx)

Di server frontend (public), arahkan prefix `/api/` ke backend private.

Contoh Nginx (frontend EC2):

```nginx
server {
  listen 80;
  server_name _;

  root /var/www/frontend;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://10.0.2.15:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Dengan pola ini:
- Frontend cukup `fetch('/api/coffees')`.
- Browser user tidak tahu/private IP backend tidak terekspos di kode JS.
- Nginx yang meneruskan request ke backend private.

## Contoh Payload JSON (POST/PUT)

```json
{
  "name": "Arabica Gayo",
  "origin": "Aceh",
  "price": 28000,
  "stock": 20,
  "description": "Rasa fruity dan clean"
}
```

## Catatan

- Backend dan frontend dipisah folder agar sederhana dan mudah deploy.
- Tidak menggunakan framework.
- Koneksi database didesain langsung untuk MySQL RDS AWS menggunakan PDO.

## Deploy AWS

- Panduan deploy lengkap (EC2 Frontend public + EC2 Backend private + RDS) ada di [DEPLOY_AWS.md](DEPLOY_AWS.md).
