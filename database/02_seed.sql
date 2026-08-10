-- BMS Database Seed Data
-- Sample data for testing and development

-- INSERT AUTHORS
INSERT INTO authors (first_name, last_name, email, bio) VALUES
('J.K.',      'Rowling',   'jk@rowling.com',      'British author best known for the Harry Potter series.'),
('Frank',     'Herbert',   'frank@herbert.com',    'American science fiction author, best known for Dune.'),
('George',    'Orwell',    'george@orwell.com',    'English novelist known for 1984 and Animal Farm.'),
('J.R.R.',    'Tolkien',   'jrr@tolkien.com',      'English author of The Lord of the Rings.'),
('Harper',    'Lee',       'harper@lee.com',       'American novelist known for To Kill a Mockingbird.');

-- INSERT CATEGORIES
INSERT INTO categories (name, description) VALUES
('Fiction',          'Literary works created from imagination.'),
('Fantasy',          'Stories featuring magical and supernatural elements.'),
('Science Fiction',  'Stories based on future science and technology.'),
('Classic',          'Books considered of high literary merit over time.'),
('Adventure',        'Stories involving exciting and dangerous journeys.');

-- INSERT BOOKS
INSERT INTO books (title, isbn, publish_date, book_type, page_count, file_size, author_id) VALUES
('Harry Potter and the Philosophers Stone', '9780747532743', '1997-06-26', 'Printed', 223,   NULL,  1),
('Harry Potter and the Chamber of Secrets', '9780747538493', '1998-07-02', 'EBook',   NULL,  '3.2', 1),
('Dune',                                   '9780441013593', '1965-08-01', 'Printed', 412,   NULL,  2),
('Dune Messiah',                           '9780425074268', '1969-01-01', 'EBook',   NULL,  '2.8', 2),
('1984',                                   '9780451524935', '1949-06-08', 'Printed', 328,   NULL,  3),
('Animal Farm',                            '9780451526342', '1945-08-17', 'EBook',   NULL,  '1.5', 3),
('The Lord of the Rings',                  '9780618640157', '1954-07-29', 'Printed', 1178,  NULL,  4),
('The Hobbit',                             '9780547928227', '1937-09-21', 'Printed', 310,   NULL,  4),
('To Kill a Mockingbird',                  '9780061935466', '1960-07-11', 'Printed', 281,   NULL,  5);

-- INSERT BOOK_CATEGORIES (many-to-many relationships)
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 2), -- Harry Potter 1 → Fantasy
(1, 5), -- Harry Potter 1 → Adventure
(2, 2), -- Harry Potter 2 → Fantasy
(2, 5), -- Harry Potter 2 → Adventure
(3, 3), -- Dune → Science Fiction
(3, 5), -- Dune → Adventure
(4, 3), -- Dune Messiah → Science Fiction
(5, 1), -- 1984 → Fiction
(5, 4), -- 1984 → Classic
(6, 1), -- Animal Farm → Fiction
(6, 4), -- Animal Farm → Classic
(7, 2), -- Lord of the Rings → Fantasy
(7, 5), -- Lord of the Rings → Adventure
(8, 2), -- The Hobbit → Fantasy
(8, 5), -- The Hobbit → Adventure
(9, 1), -- To Kill a Mockingbird → Fiction
(9, 4); -- To Kill a Mockingbird → Classic