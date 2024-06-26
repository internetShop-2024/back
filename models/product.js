const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.Review, { foreignKey: 'productId' });
    }
  }
  Product.init({
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    article: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};
