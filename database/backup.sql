-- Verify database health after restore
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify row counts
SELECT 'authors'        AS table_name, COUNT(*) AS row_count FROM authors
UNION ALL
SELECT 'categories',                   COUNT(*) FROM categories
UNION ALL
SELECT 'books',                        COUNT(*) FROM books
UNION ALL
SELECT 'book_categories',              COUNT(*) FROM book_categories;