const {Model, DataTypes} = require('sequelize');
module.exports = (sequelize) => {
    class Product extends Model {
        static associate(models) {
            Product.hasMany(models.Review, {
                foreignKey: 'productId',
                as: "reviews"
            })
            Product.belongsTo(models.Section, {
                foreignKey: "sectionId",
                as: "sections"
            })
            Product.belongsTo(models.SubSection, {
                foreignKey: "subSectionId",
                as: "subSections"
            })
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
        sectionId: DataTypes.INTEGER,
        subSectionId: DataTypes.INTEGER,
        promotion: {
            type: DataTypes.BOOLEAN,
        },
        editHistory: {
            type: DataTypes.JSONB,
        },
        stockQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        sequelize,
        modelName: 'Product',
    });
    return Product;
};
