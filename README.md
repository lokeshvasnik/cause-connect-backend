# Cause Connect Backend

Express + Mongoose + MongoDB Atlas backend for events, search, registrations, and host management.

## Setup

1. Create `.env` from `.env.example` and set `MONGODB_URI` (Atlas) and `JWT_SECRET`.
2. Install dependencies:

```bash
npm install
```

3. Seed sample data (optional):

```bash
npm run seed
```

4. Run the server:

```bash
npm run dev
```

Server starts on `http://localhost:4000`.

## Email Confirmations

- Set SMTP settings in `.env` to send registration confirmation emails:

```
SMTP_HOST=your.smtp.host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=Cause Connect <no-reply@yourdomain>
```

- In development, if SMTP is not configured, emails will be printed to the console via Nodemailer `jsonTransport`.

## Endpoints

- `GET /health`
- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- `GET /events` (filters: `term, location, tag, dateFrom, dateTo, page, pageSize, sort`)
- `GET /events/:id`
- `POST /events/:id/registrations`
- Host (JWT `role=host`): `GET /host/events`, `POST /host/events`, `PATCH /host/events/:id`, `DELETE /host/events/:id`, `GET /host/events/:id/registrations`

## Notes

- Dates are ISO-8601. Client formats display.
- Search uses case-insensitive regex across `title, tag, location, description`.
- Rate limits applied to global requests; tighten if needed.
