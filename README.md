# Unde the Radar API

This project provides a basic Express server with modules for user profiles, messaging, and media uploads.

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

## Database

The API uses **SQLite** for data storage. When you start the server for the
first time it will automatically create a file named `app.db` in the project
root containing the required tables.

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
