'use strict';

module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title cannot be empty' },
      },
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'ISBN cannot be empty' },
      },
    },
    publish_date: {
      type: DataTypes.DATEONLY,
    },
    book_type: {
      type: DataTypes.ENUM('Printed', 'EBook'),
      allowNull: false,
      validate: {
        isIn: { args: [['Printed', 'EBook']], msg: 'Book type must be Printed or EBook' },
      },
    },
    page_count: {
      type: DataTypes.INTEGER,
      validate: {
        min: { args: [1], msg: 'Page count must be greater than 0' },
      },
    },
    file_size: {
      type: DataTypes.STRING(20),
    },
    metadata: {
      type: DataTypes.JSONB,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'books',
    underscored: true,
  });

  // Associations
  Book.associate = (models) => {
    Book.belongsTo(models.Author, {
      foreignKey: 'author_id',
      as: 'author',
    });
    Book.belongsToMany(models.Category, {
      through: 'book_categories',
      foreignKey: 'book_id',
      as: 'categories',
    });
  };

  return Book;
};