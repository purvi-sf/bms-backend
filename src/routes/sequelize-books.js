const express = require("express");
const router = express.Router();
const { Book, Author, Category } = require("../../models");

// GET /api/sq/books — get all books with author and categories
router.get("/", async (req, res, next) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    next(err);
  }
});

// GET /api/sq/books/:id — get one book by id
router.get("/:id", async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });
    if (!book) return res.status(404).json({ success: false, error: "Book not found" });
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
});

// POST /api/sq/books — create a new book with transaction
router.post("/", async (req, res, next) => {
  const t = await Book.sequelize.transaction();
  try {
    const { title, isbn, publish_date, book_type, page_count, file_size, author_id, category_ids } = req.body;

    if (!title || !isbn || !book_type || !author_id) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "title, isbn, book_type and author_id are required" });
    }

    // create book inside transaction
    const book = await Book.create(
      { title, isbn, publish_date, book_type, page_count, file_size, author_id },
      { transaction: t }
    );

    // add categories if provided
    if (category_ids && category_ids.length > 0) {
      const categories = await Category.findAll({ where: { id: category_ids } });
      await book.setCategories(categories, { transaction: t });
    }

    await t.commit();

    const result = await Book.findByPk(book.id, {
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// PUT /api/sq/books/:id — update a book
router.put("/:id", async (req, res, next) => {
  const t = await Book.sequelize.transaction();
  try {
    const book = await Book.findByPk(req.params.id, { transaction: t });
    if (!book) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    await book.update(req.body, { transaction: t });

    if (req.body.category_ids) {
      const categories = await Category.findAll({ where: { id: req.body.category_ids } });
      await book.setCategories(categories, { transaction: t });
    }

    await t.commit();

    const result = await Book.findByPk(book.id, {
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });

    res.json({ success: true, data: result });
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// DELETE /api/sq/books/:id — delete a book
router.delete("/:id", async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: "Book not found" });
    await book.destroy();
    res.json({ success: true, message: "Book deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;