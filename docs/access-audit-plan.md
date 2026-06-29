# Access Management Audit & Perbaikan

## Status sekarang
- JWT auth
- Role guard
- Permission guard (DB lookup)
- Superadmin / admin bypass
- Tidak ada audit trail
- Tidak ada rate limit
- Tidak ada token revoke
- Tidak ada escalation guard

---

## P0 (Wajib sebelum prod)

### 1. Audit trail

**Apa**
Catat semua aksi sensitif ke tabel `AuditLog`.

**Aksi yang dilog**
| Aksi | Trigger |
|------|---------|
| `LOGIN_SUCCESS` | Login sukses |
| `LOGIN_FAILED` | Login gagal |
| `LOGOUT` | Logout (jika pakai refresh token revoke) |
| `REFRESH_TOKEN` | Refresh token dipakai |
| `USER_CREATED` | User baru dibuat |
| `USER_UPDATED` | User diupdate (role, status, password) |
| `USER_DELETED` | User dihapus |
| `ROLE_CHANGED` | Role user berubah |
| `PERMISSION_CHANGED` | Permission role berubah |
| `PASSWORD_CHANGED` | Password diubah |
| `SETTINGS_CHANGED` | Setting aplikasi diubah |
| `EXAM_DELETED` | Ujian dihapus |
| `QUESTION_BANK_DELETED` | Bank soal dihapus |
| `STUDENT_DELETED` | Siswa dihapus |

**Data per log**
| Field | Deskripsi |
|-------|-----------|
| `id` | UUID |
| `userId` | Pelaku |
| `action` | Nama aksi |
| `resource` | Tipe resource (User, Exam, dll) |
| `resourceId` | ID resource |
| `before` | JSON snapshot sebelumnya |
| `after` | JSON snapshot sesudah |
| `ip` | Alamat IP |
| `userAgent` | User agent |
| `createdAt` | Timestamp |

**Lokasi**
- Models: Prisma `AuditLog`
- Service: `AuditService`
- Integrasi: via decorator atau explicit di setiap service

---

### 2. Block role escalation

**Aturan**
1. User tidak bisa mengubah role sendiri
2. Hanya `SUPER_ADMIN` bisa assign `SUPER_ADMIN`
3. `ADMIN_SEKOLAH` hanya bisa assign `GURU` dan `PENGAWAS` dan `SISWA`
4. `GURU` tidak bisa manage role sama sekali
5. Saat update user, validasi:
   - actor role
   - target role baru
   - reject jika escalation

**Lokasi**
- `users.service.ts` — update
- `roles.service.ts` — jika ada manage role

---

### 3. Token revoke

**Apa**
- Setiap user punya `authVersion`
- JWT payload contains `authVersion`
- JwtStrategy compares `authVersion` saat validate
- Version di-bump saat:
  - password berubah
  - role berubah
  - user di-suspend / banned
  - force logout admin

**Implementasi**
- `User.authVersion` di Prisma (default: 0)
- JwtStrategy validate: compare `payload.authVersion` with DB
- bump on password change, role change, suspend
- optional refresh token revoke table

---

### 4. Login rate limit

**Apa**
- Batasi jumlah percobaan login per IP
- Lock sementara setelah ambang batas

**Implementasi**
- In-memory (atau Redis jika ada)
- 5 percobaan gagal → lock 5 menit
- Reset jika login sukses
- Log every failed attempt

**Lokasi**
- `auth.controller.ts` — `login` endpoint
- Atau guard level

---

## P1 (Setelah P0)

### 5. Permission matrix

Dokumentasi per route:
| Route | Method | Permission | Role allowed |
|-------|--------|------------|-------------|
| /settings | GET | - | SUPER_ADMIN |
| /settings | POST | - | SUPER_ADMIN |
| /question-banks | POST | question:bank:create | GURU, SUPER_ADMIN, ADMIN_SEKOLAH |
| /question-banks | GET | question:bank:view | GURU, SUPER_ADMIN, ADMIN_SEKOLAH, SISWA |
| ... | ... | ... | ... |

### 6. Self-service restriction
- User hanya bisa update: `fullName`, `phone`, `avatar`, `password`
- Tidak bisa edit: `username`, `role`, `isActive`
- Password change require current password

### 7. Test coverage
Minimal test per guard:
- roles.guard.spec.ts (sudah)
- permissions.guard.spec.ts (sudah)
- escalation guard baru
- token revoke
- rate limit
- audit log write

---

## Urutan eksekusi
1. Prisma `AuditLog` model + migration
2. `AuditService`
3. `User.authVersion` field + migration
4. Token revoke di JwtStrategy
5. Escalation guard di users.service
6. Rate limit login
7. Integrasi audit log di service lain
8. Test
9. Dokumen permission matrix

---

## Catatan
- Audit log wajib di setiap P0 action
- Escalation guard dan token revoke saling terkait (sama-sama di users.service)
- Rate limit bisa standalone
- Field migration harus backward compatible (default value)
