'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SubSection extends Model {
        static associate(models) {
            SubSection.belongsTo(models.Section, {
                foreignKey: "sectionId",
                as: "sections"
            })
            SubSection.hasMany(models.Product, {
                foreignKey: "subSectionId",
                as: "products"
            })
        }
    }

    SubSection.init({
        subSectionName: DataTypes.STRING,
        subSectionPhoto: DataTypes.STRING,
        sectionId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'SubSection',
    });
    return SubSection;
};