'use strict';

module.exports = {
  async up(queryInterface) {
    // Insert authors
    await queryInterface.bulkInsert('authors', [
      { first_name: 'J.K.',    last_name: 'Rowling',  email: 'jk@rowling.com',    bio: 'British author best known for the Harry Potter series.', created_at: new Date(), updated_at: new Date() },
      { first_name: 'Frank',   last_name: 'Herbert',  email: 'frank@herbert.com', bio: 'American science fiction author, best known for Dune.',  created_at: new Date(), updated_at: new Date() },
      { first_name: 'George',  last_name: 'Orwell',   email: 'george@orwell.com', bio: 'English novelist known for 1984 and Animal Farm.',       created_at: new Date(), updated_at: new Date() },
      { first_name: 'J.R.R.', last_name: 'Tolkien',  email: 'jrr@tolkien.com',   bio: 'English author of The Lord of the Rings.',               created_at: new Date(), updated_at: new Date() },
      { first_name: 'Harper',  last_name: 'Lee',      email: 'harper@lee.com',    bio: 'American novelist known for To Kill a Mockingbird.',     created_at: new Date(), updated_at: new Date() },
    ]);

    // Insert categories
    await queryInterface.bulkInsert('categories', [
      { name: 'Fiction',         description: 'Literary works created from imagination.',             created_at: new Date(), updated_at: new Date() },
      { name: 'Fantasy',         description: 'Stories featuring magical and supernatural elements.', created_at: new Date(), updated_at: new Date() },
      { name: 'Science Fiction', description: 'Stories based on future science and technology.',      created_at: new Date(), updated_at: new Date() },
      { name: 'Classic',         description: 'Books considered of high literary merit over time.',   created_at: new Date(), updated_at: new Date() },
      { name: 'Adventure',       description: 'Stories involving exciting and dangerous journeys.',   created_at: new Date(), updated_at: new Date() },
    ]);

    // Look up author IDs by last_name to avoid hardcoding
    const [authors] = await queryInterface.sequelize.query(
      `SELECT id, last_name FROM authors WHERE last_name IN ('Rowling','Herbert','Orwell','Tolkien','Lee')`
    );
    const authorMap = {};
    authors.forEach(a => { authorMap[a.last_name] = a.id; });

    // Look up category IDs by name
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories WHERE name IN ('Fiction','Fantasy','Science Fiction','Classic','Adventure')`
    );
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c.id; });

    // Insert books using looked-up author IDs
    await queryInterface.bulkInsert('books', [
      { title: 'Harry Potter and the Philosophers Stone', isbn: '9780747532743', publish_date: '1997-06-26', book_type: 'Printed', page_count: 223,  file_size: null, author_id: authorMap['Rowling'],  created_at: new Date(), updated_at: new Date() },
      { title: 'Harry Potter and the Chamber of Secrets', isbn: '9780747538493', publish_date: '1998-07-02', book_type: 'EBook',   page_count: null, file_size: '3.2', author_id: authorMap['Rowling'],  created_at: new Date(), updated_at: new Date() },
      { title: 'Dune',                                    isbn: '9780441013593', publish_date: '1965-08-01', book_type: 'Printed', page_count: 412,  file_size: null, author_id: authorMap['Herbert'],  created_at: new Date(), updated_at: new Date() },
      { title: 'Dune Messiah',                            isbn: '9780425074268', publish_date: '1969-01-01', book_type: 'EBook',   page_count: null, file_size: '2.8', author_id: authorMap['Herbert'],  created_at: new Date(), updated_at: new Date() },
      { title: '1984',                                    isbn: '9780451524935', publish_date: '1949-06-08', book_type: 'Printed', page_count: 328,  file_size: null, author_id: authorMap['Orwell'],   created_at: new Date(), updated_at: new Date() },
      { title: 'Animal Farm',                             isbn: '9780451526342', publish_date: '1945-08-17', book_type: 'EBook',   page_count: null, file_size: '1.5', author_id: authorMap['Orwell'],   created_at: new Date(), updated_at: new Date() },
      { title: 'The Lord of the Rings',                   isbn: '9780618640157', publish_date: '1954-07-29', book_type: 'Printed', page_count: 1178, file_size: null, author_id: authorMap['Tolkien'],  created_at: new Date(), updated_at: new Date() },
      { title: 'The Hobbit',                              isbn: '9780547928227', publish_date: '1937-09-21', book_type: 'Printed', page_count: 310,  file_size: null, author_id: authorMap['Tolkien'],  created_at: new Date(), updated_at: new Date() },
      { title: 'To Kill a Mockingbird',                   isbn: '9780061935466', publish_date: '1960-07-11', book_type: 'Printed', page_count: 281,  file_size: null, author_id: authorMap['Lee'],      created_at: new Date(), updated_at: new Date() },
    ]);

    // Look up book IDs by isbn
    const [books] = await queryInterface.sequelize.query(
      `SELECT id, isbn FROM books`
    );
    const bookMap = {};
    books.forEach(b => { bookMap[b.isbn] = b.id; });

    // Insert book_categories using looked-up IDs
    await queryInterface.bulkInsert('book_categories', [
      { book_id: bookMap['9780747532743'], category_id: catMap['Fantasy'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780747532743'], category_id: catMap['Adventure'],       created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780747538493'], category_id: catMap['Fantasy'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780747538493'], category_id: catMap['Adventure'],       created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780441013593'], category_id: catMap['Science Fiction'], created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780441013593'], category_id: catMap['Adventure'],       created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780425074268'], category_id: catMap['Science Fiction'], created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780451524935'], category_id: catMap['Fiction'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780451524935'], category_id: catMap['Classic'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780451526342'], category_id: catMap['Fiction'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780451526342'], category_id: catMap['Classic'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780618640157'], category_id: catMap['Fantasy'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780618640157'], category_id: catMap['Adventure'],       created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780547928227'], category_id: catMap['Fantasy'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780547928227'], category_id: catMap['Adventure'],       created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780061935466'], category_id: catMap['Fiction'],         created_at: new Date(), updated_at: new Date() },
      { book_id: bookMap['9780061935466'], category_id: catMap['Classic'],         created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('book_categories', null, {});
    await queryInterface.bulkDelete('books', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('authors', null, {});
  },
};