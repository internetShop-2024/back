const catalogRouter = require("express").Router();
const upload = require("../vars/multer");

const {Section, SubSection, Product} = require("../models");

// POST: Додавання нового розділу каталогу
catalogRouter.post("/", upload.single("sectionPhoto"), async (req, res) => {
    const {sectionName, subsections, products} = req.body;
    const sectionPhoto = req.file ? req.file.path : null;
    const missingFields = [];

    if (!sectionName) missingFields.push("sectionName");
    if (!sectionPhoto) missingFields.push("sectionPhoto");

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: "Missing required fields",
            missingFields: missingFields
        });
    }

    try {
        const section = await Section.create({
            sectionName,
            sectionPhoto
        });

        if (subsections) {
            section.subsections = await Promise.all(subsections.map(async (sub) => {
                return await SubSection.create({
                    subSectionName: sub.subSectionName,
                    catalogId: section.id
                });
            }));
        }

        if (products) {
            section.products = await Promise.all(products.map(async (prod) => {
                return await Product.create({
                    ...prod,
                    sectionId: section.id
                });
            }));
        }

        return res.status(201).json(section);
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

// POST: Додавання підрозділів до батьківського розділу
catalogRouter.post('/:catalogId/subsections', async (req, res) => {
    const {subSectionName, products} = req.body;
    const {catalogId} = req.params;
    const missingFields = [];

    if (!subSectionName) missingFields.push("subSectionName");

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: "Missing required fields",
            missingFields: missingFields
        });
    }

    try {
        const subsection = await SubSection.create({
            subSectionName,
            catalogId
        });

        if (products) {
            await Promise.all(products.map(async (prod) => {
                await Product.create({
                    ...prod,
                    subsectionId: subsection.id
                });
            }));
        }

        res.status(201).json(subsection);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

// GET: Виведення підрозділу з товарами
    catalogRouter.get('/subsections/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const subsection = await SubSection.findByPk(id, {
            include: {
                model: Product,
                as: "products"
            }
        });

        if (!subsection) {
            return res.status(404).json({error: 'Subsection not found'});
        }

        return res.json(subsection);
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

// GET: Виведення розділу з усіма товарами всіх підрозділів
catalogRouter.get('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const section = await Section.findByPk(id, {
            include: [
                {
                    model: SubSection,
                    include: {
                        model: Product,
                        as: "products"
                    },
                    as: "subSections"
                },
                {
                    model: Product,
                    as: "products"
                }
            ]
        });

        if (!section) {
            return res.status(404).json({error: 'Section not found'});
        }

        res.json(section);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

// DELETE: Видалення товару з підрозділу/розділу
catalogRouter.delete('/products/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({error: 'Product not found'});
        }

        await product.destroy();
        return res.status(204).send();
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

// DELETE: Видалення цілого підрозділу/розділу
catalogRouter.delete('/subsections/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const subsection = await SubSection.findByPk(id);
        if (!subsection) {
            return res.status(404).json({error: 'Subsection not found'});
        }

        await subsection.destroy();
        return res.status(204).send();
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

catalogRouter.delete('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const section = await Section.findByPk(id);
        if (!section) {
            return res.status(404).json({error: 'Section not found'});
        }

        await section.destroy();
        return res.status(204).send();
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

// POST: Додавання акції усім товарам розділу/підрозділу
catalogRouter.post('/:id/promotion', async (req, res) => {
    const {promotion} = req.body;
    const {id} = req.params;

    if (!promotion) {
        return res.status(400).json({
            error: "Missing required fields",
            missingFields: "promotion"
        });
    }

    try {
        const section = await Section.findByPk(id, {
            include: [
                {
                    model: SubSection,
                    include: {
                        model: Product,
                        as: "products"
                    },
                    as: "subSections"
                },
                {
                    model: Product,
                    as: "products"
                }
            ]
        });

        if (!section) {
            return res.status(404).json({error: 'Section not found'});
        }

        const products = [
            ...section.products,
            ...(section.subsections || []).reduce((acc, sub) => [...acc, ...sub.products], [])
        ];


        await Promise.all(products.map(async (product) => {
            console.log(product)
            product.promotion = promotion;
            await product.save();
        }));

        return res.status(200).json({message: 'Promotion applied to all products in the section/subsections'});
    } catch (e) {
        return res.status(500).json({error: e.message});
    }
});

module.exports = catalogRouter;
