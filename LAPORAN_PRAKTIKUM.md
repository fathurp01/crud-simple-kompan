# Laporan Praktikum
## Implementasi Arsitektur 3-Tier (Frontend–Backend–Database) di AWS

Nama: 
NIM: 
Kelas: 
Tanggal: 

---

## 1. Tujuan
Membangun aplikasi CRUD Mahasiswa dengan arsitektur 3-tier menggunakan AWS:
- Amazon VPC
- Amazon EC2
- Amazon RDS

## 2. Desain Arsitektur
- VPC: `10.0.0.0/16`
- Public Subnet (Frontend): `10.0.1.0/24`
- Private Subnet Backend: `10.0.2.0/24`
- Private Subnet Database: `10.0.3.0/24`

Diagram arsitektur tersedia di file `arsitektur-3tier.mmd`.

## 3. Langkah Implementasi
### 3.1 VPC
- Membuat VPC dengan CIDR `10.0.0.0/16`.
- **Bukti (screenshot):**

### 3.2 Subnet
- Membuat 3 subnet:
  - Public `10.0.1.0/24`
  - Private Backend `10.0.2.0/24`
  - Private Database `10.0.3.0/24`
- **Bukti (screenshot):**

### 3.3 Internet Gateway & Route Table
- Attach IGW ke VPC.
- Public RT: `0.0.0.0/0 -> IGW`.
- Private RT: tanpa route ke internet.
- Associate subnet sesuai ketentuan.
- **Bukti (screenshot):**

### 3.4 Security Group
- SG Frontend: HTTP 80 dari `0.0.0.0/0`, SSH 22 dari IP pribadi.
- SG Backend: port 5000 dari SG Frontend, SSH 22 dari `10.0.1.0/24`.
- SG RDS: MySQL 3306 dari SG Backend.
- **Bukti (screenshot):**

### 3.5 Deploy EC2 Frontend
- Ubuntu `t2.micro` pada public subnet.
- Install Nginx dan deploy file frontend.
- Konfigurasi reverse proxy ke backend private IP.
- **Bukti (screenshot EC2 running + Nginx):**

### 3.6 Deploy EC2 Backend
- Ubuntu `t2.micro` pada private subnet backend.
- Install Python Flask dependencies.
- Jalankan `backend/app.py` sebagai service.
- **Bukti (screenshot EC2 running + service aktif):**

### 3.7 Deploy RDS MySQL
- Engine MySQL `db.t3.micro` pada private DB subnet.
- Public Access = No.
- Buat database `mahasiswa_db` dan tabel `mahasiswa`.
- **Bukti (screenshot RDS running):**

### 3.8 Uji CRUD Website
- Menampilkan daftar mahasiswa.
- Menambah data.
- Mengedit data.
- Menghapus data.
- **Bukti (screenshot website CRUD berhasil):**

## 4. Endpoint API
- `GET /mahasiswa`
- `POST /mahasiswa`
- `PUT /mahasiswa/{id}`
- `DELETE /mahasiswa/{id}`

## 5. Kesimpulan
Aplikasi CRUD Mahasiswa berhasil diimplementasikan pada arsitektur 3-tier AWS dengan pemisahan frontend, backend, dan database sesuai ketentuan praktikum.

## 6. Lampiran
- Konfigurasi Nginx: `deploy/nginx/frontend.conf`
- Backend Flask: `backend/app.py`
- Schema database: `backend/schema.sql`
