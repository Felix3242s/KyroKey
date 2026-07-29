# KYRO License System

Ein modernes Lizenzverwaltungssystem mit Next.js, Express, Prisma und PostgreSQL.

## Features

### Lizenzverwaltung
- Generieren von Lizenzen mit verschiedenen Laufzeiten (1, 3, 7, 30, 90 Tage, Lifetime)
- Aktivieren, Sperren, Verlängern und Löschen von Lizenzen
- Massengenerierung von Lizenzen
- TXT- und CSV-Export
- Such- und Filterfunktionen

### Benutzerverwaltung
- Admin und Moderator Rollen
- Login-Historie
- Passwort ändern
- 2FA (Zwei-Faktor-Authentifizierung)

### Dashboard
- Statistiken und Diagramme
- Live-Updates
- Aktivierungs-Trends

### HWID-System
- HWID-Sperre beim ersten Aktivieren
- HWID-Reset mit Historie
- Reset-Limit und Cooldown

### Discord Integration
- Webhooks bei Key-Erstellung, Aktivierung, Sperre, HWID-Reset und Admin-Login

### API
- Lizenz-Validierung
- Lizenz-Informationen abrufen
- HWID-Abgleich
- API-Schlüssel für Anwendungen

### Sicherheit
- Argon2id Passwort-Hashing
- JWT Authentifizierung
- Rate-Limiting
- CSRF-Schutz
- XSS-Schutz
- Content Security Policy
- Sichere Cookies (HttpOnly, Secure, SameSite)
- IP-basierte Missbrauchserkennung
- Audit-Log für Admin-Aktionen
- Login-Sperre nach vielen Fehlversuchen

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Datenbank**: PostgreSQL
- **ORM**: Prisma
- **Authentifizierung**: JWT, Sessions, 2FA (TOTP)
- **Deployment**: Docker, Nginx, HTTPS (Let's Encrypt)

## Installation

### Voraussetzungen
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Lokale Entwicklung

1. Repository klonen
2. Backend installieren:
```bash
cd backend
npm install
cp .env.example .env
# .env Datei anpassen
npx prisma migrate dev
npx prisma generate
npm run dev
```

3. Frontend installieren:
```bash
cd frontend
npm install
npm run dev
```

### Docker Deployment

1. `.env` Datei erstellen und konfigurieren
2. SSL Zertifikate im `ssl/` Ordner platzieren
3. Docker Compose starten:
```bash
docker-compose up -d
```

## Umgebungsvariablen

Siehe `backend/.env.example` für alle verfügbaren Optionen.

## API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Registrieren
- `POST /api/auth/login` - Login
- `POST /api/auth/2fa/enable` - 2FA aktivieren
- `POST /api/auth/2fa/verify` - 2FA verifizieren
- `POST /api/auth/2fa/disable` - 2FA deaktivieren
- `POST /api/auth/change-password` - Passwort ändern

### Lizenzen
- `POST /api/licenses/generate` - Lizenz generieren
- `GET /api/licenses` - Alle Lizenzen abrufen
- `GET /api/licenses/:id` - Einzelne Lizenz abrufen
- `POST /api/licenses/activate` - Lizenz aktivieren
- `POST /api/licenses/:id/extend` - Lizenz verlängern
- `POST /api/licenses/:id/block` - Lizenz sperren
- `POST /api/licenses/:id/unblock` - Lizenz entsperren
- `DELETE /api/licenses/:id` - Lizenz löschen
- `GET /api/licenses/export/:format` - Lizenzen exportieren

### HWID
- `POST /api/hwid/:licenseId/reset` - HWID zurücksetzen
- `GET /api/hwid/:licenseId/history` - HWID-Historie abrufen

### Benutzer
- `GET /api/users` - Alle Benutzer abrufen
- `GET /api/users/:id` - Einzelnen Benutzer abrufen
- `PATCH /api/users/:id/role` - Rolle ändern
- `DELETE /api/users/:id` - Benutzer löschen
- `GET /api/users/:id/login-history` - Login-Historie abrufen

### Dashboard
- `GET /api/dashboard/stats` - Dashboard-Statistiken
- `GET /api/dashboard/audit-logs` - Audit-Logs abrufen

### Public API
- `POST /api/validate` - Lizenz validieren
- `POST /api/info` - Lizenz-Informationen abrufen
- `POST /api/reset-hwid` - HWID zurücksetzen (public)

## Lizenzschlüssel-Format

KYRO-XXXXX-XXXXX-XXXXX-XXXXX

## Sicherheit

- Alle Passwörter werden mit Argon2id gehasht
- JWT Tokens für API-Authentifizierung
- Rate-Limiting auf allen API-Endpunkten
- HTTPS wird in Produktion erzwungen
- Sichere Cookie-Einstellungen
- Regelmäßige Sicherheits-Updates

## Support

Bei Problemen oder Fragen bitte ein Issue im Repository erstellen.

## License

MIT License
