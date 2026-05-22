# Library App — Next.js Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Configuration

Copy `.env.local.example` to `.env.local` and set your API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Features

- **Books** — browse, search, and add books with availability tracking
- **Members** — manage library members, search by name or email
- **Lending** — record borrows, return books, filter active/returned, overdue detection

## Requirements

- Node.js 18+
- Backend running (see root README)
