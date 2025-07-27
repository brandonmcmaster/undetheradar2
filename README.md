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

- `GET /users` and `POST /users` – manage user profiles
- `GET /messages` and `POST /messages` – send direct messages
- `GET /media` and `POST /media` – upload and list media files

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

Once running, open [http://localhost:3000](http://localhost:3000) to use the
included demo front end. The interface lets you create users, send messages and
upload media using the API endpoints described below.

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

### `/users`

- `GET /users` – list all users
- `POST /users` – create a new user
- `GET /users/:id` – fetch a user by id

Example request to create a user:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

### `/messages`

- `GET /messages` – list all messages
- `POST /messages` – send a new message

Example request to send a message:

```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{"sender_id":1,"receiver_id":2,"content":"Hello"}'
```

### `/media`

- `GET /media` – list uploaded files
- `POST /media` – upload a file using `multipart/form-data`

Example request to upload a file:

```bash
curl -X POST http://localhost:3000/media \
  -F file=@path/to/image.png
```
