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
- Post photos and videos to your profile
- Stream and share their music
- Post show dates
- Sell merchandise directly
- Participate in a message board without algorithmic feeds
- Post updates to a shared bulletin board
- Follow other users and receive notifications for new activity

The backend is built with Node.js, Express and SQLite using CommonJS modules and
minimal dependencies. Structured logs are produced with **Pino**. Current endpoints include:

- `POST /auth/register` – create an account (set `is_artist` to `true` for artist profiles)
- `POST /auth/login` – obtain a JWT
- `GET /users` – list user profiles (`?type=artist` or `?type=user` to filter, `?q=` to search, `?letter=` to filter by first letter)
- `POST /users` – update the authenticated user's profile
- `GET /users/:id` – fetch a user by id
- `POST /users/avatar` – upload a profile picture (requires authentication)
- `GET /messages/inbox` – read your incoming messages (requires authentication)
- `GET /messages/outbox` – read your sent messages (requires authentication)
- `POST /messages` – send a new message (requires authentication)
- `GET /media` – list uploaded files
- `POST /media` – upload a file (requires authentication)
- `GET /media/:id` – stream or download a specific file
- `GET /profile-media/user/:id` – pictures and videos on a user's profile
- `POST /profile-media` – post a picture or video to your profile (requires authentication)

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

Environment variables are loaded from a `.env` file. Set `PORT`, `DB_FILE` and
`JWT_SECRET` as needed. Optional values include `CORS_ORIGIN` and rate limit
settings. The server listens on port `3000` if `PORT` is not specified.

Once running, open [http://localhost:3000](http://localhost:3000) to view the
React interface. All frontend libraries (React, React Router, Tailwind and
Babel) are included in the repository under `public/vendor` so the site works
without hitting external CDNs. The UI embraces a retro internet vibe and
 provides pages for signing in, choosing an Artist or regular User profile during registration, and browsing community profiles via the new `/browse` page which features tabs to switch between artists and users. You can also view your profile and edit it at `/profile/edit`. When signed in, your profile picture appears in the top-right corner of the navigation bar and links back to your profile. You can
 exchange messages and view uploaded media. Placeholders for the upcoming
show calendar and merch shop are also included.
Swagger documentation is available at [http://localhost:3000/docs](http://localhost:3000/docs).
Click a profile on the Browse page to view details at `/artists/:id` or `/users/:id`.

## Security

The server uses **helmet** to set common security headers and applies a
rate‑limiting middleware to reduce abuse. CORS can be enabled for a specific
origin via the `CORS_ORIGIN` environment variable. All incoming text fields are
sanitized with `express-validator` to minimize injection and XSS risks.

## Logging and Monitoring

All requests are logged in JSON format using **Pino** along with a unique request ID.
The `/metrics` endpoint exposes basic statistics like total requests, errors and
average response time.


## Database

The API uses **SQLite** for data storage. When you start the server for the
first time it will automatically create a database file specified by the
`DB_FILE` environment variable (default `app.db`) containing the required
tables. Foreign key support is enabled with
`PRAGMA foreign_keys = ON` so related records are removed when a parent row is
deleted.

Current tables include:

- `users` – basic user profiles
- `messages` – direct messages linked to `users`
- `media` – uploaded files
- `shows` – upcoming performances for an artist
- `merch` – merchandise items for sale
 - `board_posts` – message board entries with a `headline`, `content` and an `updated_at` timestamp set when edited
- `board_reactions` – user likes or dislikes on board posts
- `board_comments` – comments attached to board posts
- `profile_media` – pictures and videos displayed on user profiles

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

- `GET /users` – list users (`?type=artist` or `?type=user` to filter, `?q=` to search, `?letter=` to filter by first letter)
- `POST /users` – update the authenticated user's profile
- `GET /users/:id` – fetch a user by id
- `POST /users/avatar` – upload or update your profile picture

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

### `/profile-media`

- `GET /profile-media/user/:id` – pictures and videos on a user's profile
- `POST /profile-media` – post a picture or video to your profile (requires authentication)

### `/shows`

- `GET /shows` – list all shows
- `GET /shows/user/:id` – shows for a specific artist
- `POST /shows` – create a new show (requires authentication)

### `/merch`

- `GET /merch` – list all merch items
- `GET /merch/user/:id` – merch for a specific user
- `POST /merch` – create a merch item (requires authentication)

### `/board`

- `GET /board` – list all board posts (each includes `updated_at` if edited)
- `GET /board/user/:id` – posts by a specific user
- `POST /board` – create a new board post with `headline` and `content` (requires authentication)
- `POST /board/:id/like` – like a post (requires authentication)
- `POST /board/:id/dislike` – dislike a post (requires authentication)
- `GET /board/:id/comments` – list comments on a post
- `POST /board/:id/comments` – add a comment (requires authentication)
- `PUT /board/:id` – edit a board post's `headline` and `content` (requires authentication)
- `PUT /board/comments/:id` – edit a comment (requires authentication)
- `DELETE /board/comments/:id` – delete a comment (requires authentication)
- `DELETE /board/:id` – delete a board post (requires authentication)

### `/follow`

- `POST /follow/:id` – follow a user (requires authentication)
- `DELETE /follow/:id` – unfollow a user (requires authentication)
- `GET /follow/:id` – check if the authenticated user follows `:id`

### `/notifications`

- `GET /notifications` – list notifications for the authenticated user
- `POST /notifications/:id/read` – mark a notification as read
- `GET /notifications/unread_count` – get count of unread notifications

### Misc

- `GET /health` – simple health check returning `{ "status": "ok" }`
- `GET /metrics` – basic metrics including total requests, errors and average response time
- `GET /docs` – interactive Swagger documentation

## Validation and Error Handling

All incoming requests now go through `express-validator` checks. For example,
IDs must be integers and required fields like usernames may not be empty.
Any validation issues or other errors are caught by a centralized middleware
that logs the problem and returns a JSON response with a clear message.

## Testing

Run `npm test` to execute the Playwright unit and integration tests. The tests start the server using an in-memory SQLite database.
