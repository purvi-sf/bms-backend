-- Get all books
SELECT * FROM books;

-- Get all authors
SELECT * FROM authors;

-- Get all categories
SELECT * FROM categories;

-- Get all books with their author's full name
SELECT
    b.id,
    b.title,
    b.isbn,
    b.publish_date,
    b.book_type,
    b.page_count,
    b.file_size,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name
FROM books b
JOIN authors a ON b.author_id = a.id
ORDER BY b.title;

-- Get all books with their categories
SELECT
    b.title,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name,
    STRING_AGG(c.name, ', ') AS categories
FROM books b
JOIN authors a ON b.author_id = a.id
JOIN book_categories bc ON b.id = bc.book_id
JOIN categories c ON bc.category_id = c.id
GROUP BY b.id, b.title, a.first_name, a.last_name
ORDER BY b.title;

-- Get all books by a specific author
SELECT
    b.title,
    b.isbn,
    b.publish_date,
    b.book_type
FROM books b
JOIN authors a ON b.author_id = a.id
WHERE a.last_name = 'Orwell';

-- Get all books in a specific category
SELECT
    b.title,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name,
    b.book_type
FROM books b
JOIN authors a ON b.author_id = a.id
JOIN book_categories bc ON b.id = bc.book_id
JOIN categories c ON bc.category_id = c.id
WHERE c.name = 'Fiction'
ORDER BY b.title;

-- AGGREGATE QUERIES
-- Count books per author
SELECT
    CONCAT(a.first_name, ' ', a.last_name) AS author_name,
    COUNT(b.id) AS book_count
FROM authors a
LEFT JOIN books b ON a.id = b.author_id
GROUP BY a.id, a.first_name, a.last_name
ORDER BY book_count DESC;

-- Count books per category
SELECT
    c.name AS category,
    COUNT(bc.book_id) AS book_count
FROM categories c
LEFT JOIN book_categories bc ON c.id = bc.category_id
GROUP BY c.id, c.name
ORDER BY book_count DESC;

-- Count printed vs ebook
SELECT
    book_type,
    COUNT(*) AS total
FROM books
GROUP BY book_type;

-- FILTER QUERIES
-- Get all EBooks
SELECT
    b.title,
    b.file_size,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name
FROM books b
JOIN authors a ON b.author_id = a.id
WHERE b.book_type = 'EBook'
ORDER BY b.title;

-- Get all Printed books
SELECT
    b.title,
    b.page_count,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name
FROM books b
JOIN authors a ON b.author_id = a.id
WHERE b.book_type = 'Printed'
ORDER BY b.page_count DESC;

-- Get books published before 1950
SELECT
    b.title,
    b.publish_date,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name
FROM books b
JOIN authors a ON b.author_id = a.id
WHERE b.publish_date < '1950-01-01'
ORDER BY b.publish_date;

-- Search books by title
SELECT
    b.title,
    b.isbn,
    CONCAT(a.first_name, ' ', a.last_name) AS author_name
FROM books b
JOIN authors a ON b.author_id = a.id
WHERE LOWER(b.title) LIKE '%the%'
ORDER BY b.title;

-- UPDATE QUERIES
-- Update a book's page count
UPDATE books
SET page_count = 230
WHERE isbn = '978-0-06-112008-4';

-- Update an author's email
UPDATE authors
SET email = 'jkrowling@rowling.com'
WHERE last_name = 'Rowling';

-- DELETE QUERIES
-- Delete a book by isbn (CASCADE removes book_categories too)
-- DELETE FROM books WHERE isbn = '978-0-06-112008-4';

-- Delete an author (CASCADE removes their books and book_categories too)
-- DELETE FROM authors WHERE last_name = 'Orwell';

-- TRANSACTION
-- Adds a new author and book as one atomic operation
-- If any step fails, everything rolls back
BEGIN;

INSERT INTO authors (first_name, last_name, email, bio)
VALUES ('Agatha', 'Christie', 'agatha@christie.com', 'English mystery writer.');

INSERT INTO books (title, isbn, publish_date, book_type, page_count, author_id)
VALUES ('Murder on the Orient Express', '9780007119318', '1934-01-01', 'Printed', 256,
    (SELECT id FROM authors WHERE last_name = 'Christie'));

INSERT INTO book_categories (book_id, category_id)
VALUES (
    (SELECT id FROM books WHERE isbn = '9780007119318'),
    (SELECT id FROM categories WHERE name = 'Fiction')
);

COMMIT;

-- VIEWS
-- Use the books_full_detail view
SELECT * FROM books_full_detail ORDER BY title;

-- Use the author_stats view
SELECT * FROM author_stats ORDER BY total_books DESC;

-- CTE
-- Find authors who write both Printed and EBook
WITH author_book_types AS (
    SELECT
        CONCAT(a.first_name, ' ', a.last_name) AS author_name,
        COUNT(CASE WHEN b.book_type = 'Printed' THEN 1 END) AS printed_count,
        COUNT(CASE WHEN b.book_type = 'EBook' THEN 1 END) AS ebook_count
    FROM authors a
    JOIN books b ON a.id = b.author_id
    GROUP BY a.id, a.first_name, a.last_name
)
SELECT author_name, printed_count, ebook_count
FROM author_book_types
WHERE printed_count > 0 AND ebook_count > 0;


-- Add metadata column
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add metadata to one book
UPDATE books
SET metadata = '{"awards": ["Hugo Award"], "language": "English", "edition": "First"}'
WHERE title = 'Dune';

-- Query JSON field
SELECT title, metadata->>'awards' AS awards
FROM books
WHERE metadata IS NOT NULL;