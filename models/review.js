const {Model, DataTypes} = require('sequelize');
module.exports = (sequelize) => {
    class Review extends Model {
        static associate(models) {
            Review.belongsTo(models.Product, {
                foreignKey: 'productId',
                as: "products"
            });
        }
    }

    Review.init({
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Review',
    });
    return Review;
};
