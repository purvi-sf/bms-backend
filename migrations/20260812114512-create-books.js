'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('books', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      isbn: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      publish_date: {
        type: Sequelize.DATEONLY,
      },
      book_type: {
        type: Sequelize.ENUM('Printed', 'EBook'),
        allowNull: false,
      },
      page_count: {
        type: Sequelize.INTEGER,
      },
      file_size: {
        type: Sequelize.STRING(20),
      },
      metadata: {
        type: Sequelize.JSONB,
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'authors',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index on author_id for faster JOINs
    await queryInterface.addIndex('books', ['author_id'], {
      name: 'idx_books_author_id',
    });

    // CHECK constraint: page_count must be positive if provided
    await queryInterface.addConstraint('books', {
      fields: ['page_count'],
      type: 'check',
      name: 'books_page_count_check',
      where: {
        page_count: { [Sequelize.Op.gt]: 0 },
      },
    });
  },

  async down(queryInterface) {
    // Remove constraints and indexes before dropping table
    await queryInterface.removeConstraint('books', 'books_page_count_check');
    await queryInterface.removeIndex('books', 'idx_books_author_id');
    await queryInterface.dropTable('books');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_books_book_type";'
    );
  },
};