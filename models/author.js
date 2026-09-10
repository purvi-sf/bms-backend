'use strict';

module.exports = (sequelize, DataTypes) => {
  const Author = sequelize.define('Author', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'First name cannot be empty' },
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Last name cannot be empty' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
      },
    },
    bio: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'authors',
    underscored: true,
  });

  // Associations
  Author.associate = (models) => {
    Author.hasMany(models.Book, {
      foreignKey: 'author_id',
      as: 'books',
      onDelete: 'CASCADE',
    });
  };

  return Author;
};