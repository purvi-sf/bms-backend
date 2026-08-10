-- Drop tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS book_categories CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- AUTHORS TABLE
-- Stores author information separately from books
-- One author can write many books (one-to-many)
CREATE TABLE authors (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE,
    bio         TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
-- Stores book genres/categories separately from books
-- One category can have many books (one-to-many)
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKS TABLE
-- Main entity — references authors and categories
-- author_id is a foreign key to authors table
CREATE TABLE books (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    isbn         VARCHAR(20)  NOT NULL UNIQUE,
    publish_date DATE,
    book_type    VARCHAR(10)  NOT NULL CHECK (book_type IN ('Printed', 'EBook')),
    page_count   INTEGER      CHECK (page_count > 0),
    file_size    VARCHAR(20),
    author_id    INTEGER      NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- BOOK_CATEGORIES TABLE
-- Junction table for many-to-many between books and categories
-- One book can belong to many categories
-- One category can have many books
CREATE TABLE book_categories (
    book_id     INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);

-- INDEXES for performance

CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_book_categories_book_id ON book_categories(book_id);
CREATE INDEX idx_book_categories_category_id ON book_categories(category_id);

-- Virtual tables based on queries
-- Simplifies complex joins into reusable named queries
-- View: books with full author name and categories
CREATE VIEW books_full_detail AS
SELECT
    b.id,
    b.title,
    b.isbn,
    b.publish_date,
    b.book_type,
    b.page_count,
    b.file_size,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name,
    a.email AS author_email,
    STRING_AGG(c.name, ', ') AS categories
FROM books b
JOIN authors a ON b.author_id = a.id
LEFT JOIN book_categories bc ON b.id = bc.book_id
LEFT JOIN categories c ON bc.category_id = c.id
GROUP BY b.id, b.title, b.isbn, b.publish_date,
         b.book_type, b.page_count, b.file_size,
         a.first_name, a.last_name, a.email;

-- View: author statistics
CREATE VIEW author_stats AS
SELECT
    a.id,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name,
    COUNT(b.id) AS total_books,
    COUNT(CASE WHEN b.book_type = 'Printed' THEN 1 END) AS printed_books,
    COUNT(CASE WHEN b.book_type = 'EBook' THEN 1 END) AS ebooks
FROM authors a
LEFT JOIN books b ON a.id = b.author_id
GROUP BY a.id, a.first_name, a.last_name;