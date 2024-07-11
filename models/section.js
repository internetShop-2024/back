'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Section extends Model {
        static associate(models) {
            Section.hasMany(models.SubSection, {
                foreignKey: "sectionId",
                as: "subSections"
            })
            Section.hasMany(models.Product, {
                foreignKey: "sectionId",
                as: "products"
            })
        }
    }

    Section.init({
        sectionName: DataTypes.STRING,
        sectionPhoto: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Section',
    });
    return Section;
};