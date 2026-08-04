// Using @purvi-sf/bms-books-client from GitHub Packages
// instead of writing axios calls directly — demonstrates GitHub Packages dependency management
const { getAllBooks, getBookById, addBook, updateBook, deleteBook } = require("@purvi-sf/bms-books-client");

module.exports = { getAllBooks, getBookById, addBook, updateBook, deleteBook };