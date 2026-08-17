'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Category name cannot be empty' },
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'categories',
    underscored: true,
  });

  // Associations
  Category.associate = (models) => {
    Category.belongsToMany(models.Book, {
      through: 'book_categories',
      foreignKey: 'category_id',
      as: 'books',
    });
  };

  return Category;
};