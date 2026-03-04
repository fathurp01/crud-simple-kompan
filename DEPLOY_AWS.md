# Deploy ke AWS (Frontend & Backend Dipisah)

Panduan ini mengikuti arsitektur:
- **EC2 Frontend (Public Subnet)**: melayani file `frontend/` + reverse proxy `/api/*`
- **EC2 Backend (Private Subnet)**: menjalankan API PHP (`backend/`)
- **RDS MySQL (Private Subnet)**: database aplikasi

## 1) Arsitektur & Security Group

## Komponen
- FE EC2: punya Public IP / EIP
- BE EC2: **tanpa** Public IP
- RDS MySQL: **tanpa** Public Access

## Security Group rekomendasi
- `sg-frontend`
  - Inbound: `80,443` dari `0.0.0.0/0`
  - Outbound: allow ke `sg-backend` port `8000`
- `sg-backend`
  - Inbound: `8000` dari `sg-frontend`
  - Outbound: allow ke `sg-rds` port `3306`
- `sg-rds`
  - Inbound: `3306` dari `sg-backend`

## 2) Siapkan Backend EC2 (Private)

Upload project ke backend, misalnya ke `/opt/kopi-app`.

Jalankan di BE:

```bash
sudo mkdir -p /opt/kopi-app
# copy folder backend ke /opt/kopi-app/backend
```

Set environment (gunakan endpoint private RDS):

```bash
echo 'DB_HOST=your-rds-endpoint.rds.amazonaws.com' | sudo tee -a /etc/environment
echo 'DB_PORT=3306' | sudo tee -a /etc/environment
echo 'DB_NAME=kopi_db' | sudo tee -a /etc/environment
echo 'DB_USER=admin' | sudo tee -a /etc/environment
echo 'DB_PASS=yourpassword' | sudo tee -a /etc/environment
```

Buat service systemd backend:

```bash
sudo tee /etc/systemd/system/kopi-backend.service > /dev/null << 'EOF'
[Unit]
Description=Kopi PHP Backend API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/kopi-app/backend
EnvironmentFile=-/etc/environment
ExecStart=/usr/bin/php -S 0.0.0.0:8000 -t /opt/kopi-app/backend /opt/kopi-app/backend/router.php
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kopi-backend
sudo systemctl restart kopi-backend
sudo systemctl status kopi-backend --no-pager
```

## 3) Siapkan Database RDS

Dari host yang bisa akses RDS (mis. BE EC2), jalankan schema:

```bash
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p kopi_db < /opt/kopi-app/backend/schema.sql
```

## 4) Siapkan Frontend EC2 (Public)

Copy folder frontend ke `/var/www/kopi-frontend`.

```bash
sudo mkdir -p /var/www/kopi-frontend
# copy isi folder frontend/ ke /var/www/kopi-frontend/
```

Pasang config Nginx frontend (gunakan IP private BE di `proxy_pass`):

```bash
sudo cp /path/project/deploy/nginx/frontend.conf /etc/nginx/sites-available/kopi-frontend
sudo ln -s /etc/nginx/sites-available/kopi-frontend /etc/nginx/sites-enabled/kopi-frontend
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> Di file `frontend.conf`, ubah `proxy_pass http://10.0.2.15:8000;` ke private IP backend Anda.

## 5) Verifikasi

Dari browser publik:
- `http://PUBLIC_IP_FE/` → halaman frontend tampil
- `http://PUBLIC_IP_FE/health` (opsional jika diarahkan via FE) atau cek dari FE ke BE:

Dari FE server:

```bash
curl http://10.0.2.15:8000/health
curl http://10.0.2.15:8000/api/coffees
```

Dari browser user:
- CRUD create/read/update/delete harus jalan via `/api/coffees`

## 6) HTTPS (Direkomendasikan)

Untuk production:
- Gunakan ALB + ACM certificate, atau
- Pasang certbot di FE EC2

## Catatan penting

- Frontend JS sudah menggunakan relative path `/api/coffees`, jadi tidak mengekspos private IP backend di browser.
- Backend tetap bisa pakai endpoint private RDS via env `DB_HOST`.
- Jika backend pindah host/IP, cukup ubah `proxy_pass` di FE Nginx, tanpa ubah frontend JS.
