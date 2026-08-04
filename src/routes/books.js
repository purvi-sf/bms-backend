const express = require("express");
const router = express.Router();
const { getAllBooks, getBookById, addBook, updateBook, deleteBook } = require("../data/books");

// GET /api/books — fetch all books
router.get("/", async (req, res, next) => {
  try {
    const books = await getAllBooks();
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id — fetch one book by id
router.get("/:id", async (req, res, next) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: "Book not found" });
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
});

// POST /api/books — add a new book
router.post("/", async (req, res, next) => {
  try {
    const { title, author, isbn, publishDate, genre, bookType } = req.body;

    // Basic validation — required fields must be present
    if (!title || !author || !isbn || !publishDate || !genre || !bookType) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const newBook = await addBook(req.body);
    res.status(201).json({ success: true, data: newBook });
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id — update a book by id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await updateBook(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id — delete a book by id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteBook(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;