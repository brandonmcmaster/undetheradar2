# Under the Radar API

Under The Radar is a grassroots, artist-first platform for underground
musicians. It's built for those who care more about real connection than
gaming algorithms. We reject engagement farming and corporate control.
Musicians own their profiles, connect directly with fans and collaborate with
one another on their own terms.

Our mission is to create the premier place where independent artists can
thrive, connect and get paid—without selling out. This repository houses the
API that powers the platform. It aims to provide artists with a simple place
to:

- Create and maintain personal profiles
- Upload photos and videos
- Stream and share their music
- Post show dates
- Sell merchandise directly
- Participate in a message board without algorithmic feeds
- Post updates to a shared bulletin board

The backend is built with Node.js, Express and SQLite using CommonJS modules and
minimal dependencies. Structured logs are produced with **Pino**. Current endpoints include:

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
React interface. All frontend libraries (React, React Router, Tailwind and
Babel) are included in the repository under `public/vendor` so the site works
without hitting external CDNs. The UI embraces a retro internet vibe and
provides pages for signing in, browsing artists (with individual artist profiles), managing your profile,
exchanging messages and viewing uploaded media. Placeholders for the upcoming
show calendar and merch shop are also included.
Click an artist on the Artists page to view their profile at `/artists/:id`.

## Logging and Monitoring

All requests are logged in JSON format using **Pino** along with a unique request ID.
The `/metrics` endpoint exposes basic statistics like total requests, errors and
average response time.


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

### `/shows`

- `GET /shows` – list all shows
- `GET /shows/user/:id` – shows for a specific artist
- `POST /shows` – create a new show (requires authentication)

### `/merch`

- `GET /merch` – list all merch items
- `GET /merch/user/:id` – merch for a specific user
- `POST /merch` – create a merch item (requires authentication)

### `/board`

- `GET /board` – list all board posts
- `GET /board/user/:id` – posts by a specific user
- `POST /board` – create a new board post (requires authentication)

### Misc

- `GET /health` – simple health check returning `{ "status": "ok" }`
- `GET /metrics` – basic metrics including total requests, errors and average response time

## Validation and Error Handling

All incoming requests now go through `express-validator` checks. For example,
IDs must be integers and required fields like usernames may not be empty.
Any validation issues or other errors are caught by a centralized middleware
that logs the problem and returns a JSON response with a clear message.

## Testing

Run `npm test` to execute the Playwright unit and integration tests. The tests start the server using an in-memory SQLite database.
