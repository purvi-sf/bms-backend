# BMS Database

PostgreSQL database schema for the Book Management System.

## Schema

### Tables
- `authors` — stores author information
- `categories` — stores book genres/categories
- `books` — main book table, references authors
- `book_categories` — junction table for many-to-many between books and categories

### Relationships
- One author writes many books (one-to-many)
- One book belongs to one author (many-to-one)
- One book can have many categories (many-to-many)
- One category can have many books (many-to-many)

## Normalization

### 1NF
Every column contains atomic values — no arrays or comma-separated lists.

### 2NF
Every non-key column depends on the whole primary key — author info lives in authors table, not repeated in books.

### 3NF
No transitive dependencies — category info lives in categories table, not in books. No column depends on another non-key column.

## Setup

### Prerequisites
- PostgreSQL 16+

### Run

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE bms;

# Connect to database
\c bms

# Run schema
\i database/01_schema.sql

# Run seed data
\i database/02_seed.sql
```

## Files

| File | Description |
|---|---|
| `01_schema.sql` | Creates all tables, indexes, constraints |
| `02_seed.sql` | Inserts sample data from MockAPI dataset |
| `03_queries.sql` | Common queries for BMS operations |