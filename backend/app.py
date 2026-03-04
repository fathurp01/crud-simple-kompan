import os
from typing import Any

import pymysql
from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)

cors_origins_raw = os.getenv("CORS_ORIGINS", "*").strip()
cors_origins = (
    "*"
    if cors_origins_raw == "*"
    else [item.strip() for item in cors_origins_raw.split(",") if item.strip()]
)
CORS(
    app,
    resources={r"/*": {"origins": cors_origins}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)


def get_db_connection() -> pymysql.connections.Connection:
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_pass = os.getenv("DB_PASS", "")
    db_port = int(os.getenv("DB_PORT", "3306"))

    if not all([db_host, db_name, db_user]):
        raise RuntimeError(
            "Environment variables DB_HOST, DB_NAME, DB_USER, dan DB_PASS wajib diisi"
        )

    return pymysql.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_pass,
        database=db_name,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def parse_payload(payload: dict[str, Any]) -> dict[str, Any]:
    nama = str(payload.get("nama", "")).strip()
    jurusan = str(payload.get("jurusan", "")).strip()
    angkatan_raw = payload.get("angkatan")

    if not nama or not jurusan or angkatan_raw is None:
        raise ValueError("Field nama, jurusan, dan angkatan wajib diisi")

    try:
        angkatan = int(angkatan_raw)
    except (TypeError, ValueError) as exc:
        raise ValueError("Field angkatan harus berupa angka") from exc

    return {"nama": nama, "jurusan": jurusan, "angkatan": angkatan}


@app.get("/mahasiswa")
@app.get("/api/mahasiswa")
def get_mahasiswa():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, nama, jurusan, angkatan FROM mahasiswa ORDER BY id DESC"
                )
                data = cursor.fetchall()
        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return jsonify(
            {"success": False, "message": f"Gagal mengambil data: {str(exc)}"}
        ), 500


@app.post("/mahasiswa")
@app.post("/api/mahasiswa")
def create_mahasiswa():
    try:
        payload = parse_payload(request.get_json(silent=True) or {})
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO mahasiswa (nama, jurusan, angkatan) VALUES (%s, %s, %s)",
                    (payload["nama"], payload["jurusan"], payload["angkatan"]),
                )
                new_id = cursor.lastrowid

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Data mahasiswa berhasil ditambahkan",
                    "data": {"id": new_id, **payload},
                }
            ),
            201,
        )
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify(
            {"success": False, "message": f"Gagal menambah data: {str(exc)}"}
        ), 500


@app.put("/mahasiswa/<int:mahasiswa_id>")
@app.put("/api/mahasiswa/<int:mahasiswa_id>")
def update_mahasiswa(mahasiswa_id: int):
    try:
        payload = parse_payload(request.get_json(silent=True) or {})
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE mahasiswa SET nama=%s, jurusan=%s, angkatan=%s WHERE id=%s",
                    (
                        payload["nama"],
                        payload["jurusan"],
                        payload["angkatan"],
                        mahasiswa_id,
                    ),
                )
                if cursor.rowcount == 0:
                    return jsonify(
                        {"success": False, "message": "Data mahasiswa tidak ditemukan"}
                    ), 404

        return jsonify(
            {"success": True, "message": "Data mahasiswa berhasil diperbarui"}
        ), 200
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify(
            {"success": False, "message": f"Gagal memperbarui data: {str(exc)}"}
        ), 500


@app.delete("/mahasiswa/<int:mahasiswa_id>")
@app.delete("/api/mahasiswa/<int:mahasiswa_id>")
def delete_mahasiswa(mahasiswa_id: int):
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM mahasiswa WHERE id=%s", (mahasiswa_id,))
                if cursor.rowcount == 0:
                    return jsonify(
                        {"success": False, "message": "Data mahasiswa tidak ditemukan"}
                    ), 404

        return jsonify(
            {"success": True, "message": "Data mahasiswa berhasil dihapus"}
        ), 200
    except Exception as exc:
        return jsonify(
            {"success": False, "message": f"Gagal menghapus data: {str(exc)}"}
        ), 500


@app.get("/health")
def health_check():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
