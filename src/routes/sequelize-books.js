const express = require("express");
const router = express.Router();
const { Book, Author, Category } = require("../../models");

// GET /api/sq/books — get all books with author and categories (paginated)
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const { rows: books, count } = await Book.findAndCountAll({
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      count,
      limit,
      offset,
      data: books,
    });
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
  let newBookId;

  try {
    const { title, isbn, publish_date, book_type, author_id, category_ids } = req.body;

    if (!title || !isbn || !book_type || !author_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "title, isbn, book_type and author_id are required",
      });
    }

    const book = await Book.create(
      { title, isbn, publish_date, book_type, author_id },
      { transaction: t }
    );

    newBookId = book.id;

    if (category_ids && category_ids.length > 0) {
      const categories = await Category.findAll({
        where: { id: category_ids },
        transaction: t,
      });
      if (categories.length !== category_ids.length) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: "One or more category_ids do not exist",
        });
      }
      await book.setCategories(categories, { transaction: t });
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    return next(err);
  }

  // Re-read OUTSIDE the transaction -- after commit is complete
  try {
    const result = await Book.findByPk(newBookId, {
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sq/books/:id — update a book with transaction
router.put("/:id", async (req, res, next) => {
  const t = await Book.sequelize.transaction();
  let updatedBookId;

  try {
    const book = await Book.findByPk(req.params.id, { transaction: t });
    if (!book) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    updatedBookId = book.id;

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      "title", "isbn", "publish_date", "book_type",
      "page_count", "file_size", "metadata", "author_id",
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await book.update(updateData, { transaction: t });

    if (req.body.category_ids) {
      const categories = await Category.findAll({
        where: { id: req.body.category_ids },
        transaction: t,
      });
      if (categories.length !== req.body.category_ids.length) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: "One or more category_ids do not exist",
        });
      }
      await book.setCategories(categories, { transaction: t });
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    return next(err);
  }

  // Re-read OUTSIDE the transaction -- after commit is complete
  try {
    const result = await Book.findByPk(updatedBookId, {
      include: [
        { model: Author, as: "author" },
        { model: Category, as: "categories" },
      ],
    });
    res.json({ success: true, data: result });
  } catch (err) {
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