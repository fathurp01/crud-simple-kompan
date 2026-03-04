# Tugas Praktikum AWS: Arsitektur 3-Tier (Frontend–Backend–Database)

Dokumen ini mengikuti ketentuan:
- VPC: `10.0.0.0/16`
- Public Subnet (Frontend): `10.0.1.0/24`
- Private Subnet Backend: `10.0.2.0/24`
- Private Subnet Database: `10.0.3.0/24`

## 1) Setup Jaringan (VPC, Subnet, Route)

1. Buat VPC dengan CIDR `10.0.0.0/16`.
2. Buat 3 subnet:
   - Public: `10.0.1.0/24`
   - Private Backend: `10.0.2.0/24`
   - Private Database: `10.0.3.0/24`
3. Buat Internet Gateway dan attach ke VPC.
4. Buat Route Table:
   - Public RT: route `0.0.0.0/0` ke Internet Gateway
   - Private RT: tanpa route langsung ke internet
5. Associate subnet:
   - Public Subnet → Public RT
   - Private Backend + Private DB → Private RT

## 2) Security Group

### SG Frontend (`sg-frontend`)
- Inbound:
  - HTTP `80` dari `0.0.0.0/0`
  - SSH `22` dari IP pribadi Anda
- Outbound: default allow

### SG Backend (`sg-backend`)
- Inbound:
  - App port `5000` hanya dari `sg-frontend`
  - SSH `22` dari Public Subnet (`10.0.1.0/24`)
- Outbound: allow ke DB `3306`

### SG Database (`sg-rds`)
- Inbound:
  - MySQL `3306` hanya dari `sg-backend`

## 3) Deploy RDS MySQL

1. Engine: MySQL
2. Instance: `db.t3.micro`
3. DB Subnet Group: gunakan subnet `10.0.3.0/24` (dan subnet private lain di AZ berbeda jika diperlukan)
4. Public Access: **No**
5. Security Group: `sg-rds`
6. Buat database `mahasiswa_db`
7. Eksekusi file `backend/schema.sql`

Contoh import dari EC2 backend:

```bash
mysql -h <rds-endpoint> -u admin -p mahasiswa_db < /opt/mahasiswa-app/backend/schema.sql
```

## 4) Deploy EC2 Backend (Private)

1. Launch EC2 Ubuntu `t2.micro` di subnet `10.0.2.0/24` tanpa public IP.
2. Pasang Python dan dependensi:

```bash
sudo apt update
sudo apt install -y python3 python3-pip
pip3 install flask flask-cors pymysql
```

3. Upload folder project ke `/opt/mahasiswa-app`.
4. Set environment:

```bash
echo 'DB_HOST=<rds-endpoint>' | sudo tee -a /etc/environment
echo 'DB_PORT=3306' | sudo tee -a /etc/environment
echo 'DB_NAME=mahasiswa_db' | sudo tee -a /etc/environment
echo 'DB_USER=admin' | sudo tee -a /etc/environment
echo 'DB_PASS=<password>' | sudo tee -a /etc/environment
```

5. Buat service systemd:

```bash
sudo tee /etc/systemd/system/mahasiswa-backend.service > /dev/null << 'EOF'
[Unit]
Description=Flask Backend Mahasiswa
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/mahasiswa-app/backend
EnvironmentFile=-/etc/environment
ExecStart=/usr/bin/python3 /opt/mahasiswa-app/backend/app.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable mahasiswa-backend
sudo systemctl restart mahasiswa-backend
sudo systemctl status mahasiswa-backend --no-pager
```

Endpoint backend:
- `GET /mahasiswa`
- `POST /mahasiswa`
- `PUT /mahasiswa/{id}`
- `DELETE /mahasiswa/{id}`

## 5) Deploy EC2 Frontend (Public)

1. Launch EC2 Ubuntu `t2.micro` di subnet `10.0.1.0/24` (public IP aktif).
2. Install Nginx:

```bash
sudo apt update
sudo apt install -y nginx
```

3. Copy frontend ke `/var/www/mahasiswa-frontend`.
4. Copy file `deploy/nginx/frontend.conf` ke:

```bash
sudo cp /path/project/deploy/nginx/frontend.conf /etc/nginx/sites-available/mahasiswa-frontend
sudo ln -s /etc/nginx/sites-available/mahasiswa-frontend /etc/nginx/sites-enabled/mahasiswa-frontend
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

5. Ubah `proxy_pass` di `frontend.conf` ke private IP backend, contoh `10.0.2.15:5000`.

## 6) Verifikasi

1. Dari FE EC2:

```bash
curl http://10.0.2.15:5000/health
curl http://10.0.2.15:5000/mahasiswa
```

2. Dari browser publik:
- Buka `http://<PUBLIC_IP_FRONTEND>/`
- Coba CRUD mahasiswa (tambah, edit, hapus)

## 7) Bukti untuk Dikumpulkan

1. Screenshot/rekaman:
   - VPC
   - Subnet
   - Route Table
   - Security Group
   - EC2 frontend & backend running
   - RDS running
   - Website CRUD berhasil
2. Diagram arsitektur (buat ulang sendiri)
3. Gabungkan jadi dokumen `.docx`
