# Under the Radar API

This repository contains the starting API for **Under the Radar**, an old‑school
community site geared toward underground musicians. The project aims to provide
artists with a simple place to:

- Create and maintain personal profiles
- Upload photos and videos
- Stream and share their music
- Post show dates
- Sell merchandise directly
- Participate in a message board without algorithmic feeds

The backend is built with Node.js, Express and SQLite using CommonJS modules and
minimal dependencies. Current endpoints include:

- `POST /auth/register` – create an account
- `POST /auth/login` – obtain a JWT
- `GET /users` – list user profiles
- `POST /users` – update the authenticated user's profile
- `GET /users/:id` – fetch a user by id
- `GET /messages/inbox` – read your incoming messages (requires authentication)
- `GET /messages/outbox` – read your sent messages (requires authentication)
- `POST /messages` – send a new message (requires authentication)
- `GET /media` – list uploaded files
- `POST /media` – upload a file (requires authentication)
- `GET /media/:id` – stream or download a specific file

Future additions will cover show listings, merch management and the message
board. Everything is intentionally straightforward with no ranking algorithms.

## Setup

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The server listens on port `3000` by default.

Once running, open [http://localhost:3000](http://localhost:3000) to view the
new React interface. The UI is built with **Tailwind CSS** and embraces a retro
internet vibe. It provides pages for signing in, browsing artists, managing
your profile, exchanging messages and viewing uploaded media. Placeholders for
the upcoming show calendar and merch shop are also included.

## Database

The API uses **SQLite** for data storage. When you start the server for the
first time it will automatically create a file named `app.db` in the project
root containing the required tables. Foreign key support is enabled with
`PRAGMA foreign_keys = ON` so related records are removed when a parent row is
deleted.

Current tables include:

- `users` – basic user profiles
- `messages` – direct messages linked to `users`
- `media` – uploaded files
- `shows` – upcoming performances for an artist
- `merch` – merchandise items for sale
- `board_posts` – simple message board entries

## API Endpoints

### `/auth`

- `POST /auth/register` – register a new user
- `POST /auth/login` – log in and receive a token

Example registration request:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","username":"alice","password":"secret"}'
```

Example login request:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'
```

### `/users`

- `GET /users` – list all users
- `POST /users` – update the authenticated user's profile
- `GET /users/:id` – fetch a user by id

### `/messages`

- `GET /messages/inbox` – list messages sent **to** the authenticated user
- `GET /messages/outbox` – list messages **from** the authenticated user
- `POST /messages` – send a new message (requires authentication)

Example request to send a message:

```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id":2,"content":"Hello"}'
```

### `/media`

- `GET /media` – list uploaded files with metadata
- `POST /media` – upload a file using `multipart/form-data` (requires authentication)
- `GET /media/:id` – stream or download the file by id

Example request to upload a file:

```bash
curl -X POST http://localhost:3000/media \
  -H "Authorization: Bearer <TOKEN>" \
  -F file=@path/to/image.png
```

Uploaded files are stored in the `uploads` directory and scanned with
`clamscan` when available. Only JPEG, PNG, MP3 and MP4 files up to 10 MB are
accepted. The database records the original filename, MIME type, size and the
user who uploaded each file.

## Validation and Error Handling

All incoming requests now go through `express-validator` checks. For example,
IDs must be integers and required fields like usernames may not be empty.
Any validation issues or other errors are caught by a centralized middleware
that logs the problem and returns a JSON response with a clear message.
