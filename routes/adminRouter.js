const adminRouter = require("express").Router()

const Admin = require("../models/adminModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Review = require("../models/reviewModel")
const Blog = require("../models/blogModel")
const Product = require("../models/productModel")
const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const Pack = require("../models/packModel")

const adminValidator = require("../validators/adminValidator")
const orderUpdateValidator = require("../validators/orderUpdateValidator")
const productUpdateValidator = require("../validators/productUpdateValidator")
const packUpdateValidator = require("../validators/packUpdateValidator")


const {perPage} = require("../vars/publicVars")

const {
    passwordHash,
    adminTokenAssign,
    passwordCompare,
    convertToArray,
    filterSystem,
    export2csvSystem,
    validatePhone,
    orderProducts,
    productReviews,
    productCategory,
    chooseSection,
    usersHistory,
    historyProducts,
    packProducts,
    reviewsSenders
} = require("../vars/functions")
const mongoose = require("mongoose");

//GET
adminRouter.get("/users", adminValidator, async (req, res) => {
        let {id, orderId} = req.query
        try {
            let users
            if (id && !orderId) {
                const user = await User
                    .find({_id: id})
                    .select("-password -refreshToken")
                    .lean()
                if (!user?.length)
                    return res.status(404).json({error: "Нема користувачів"})

                await usersHistory(user)
                return res.status(200).json({user: user})
            } else if (id && orderId) {
                const user = await User
                    .findById(id)
                    .select('phone')
                    .lean()

                const order = await Order
                    .find({_id: orderId, phone: user.phone})
                    .lean()

                await historyProducts(order)
                return res.status(200).json({order: order})
            } else {
                const data = await filterSystem(req.query)
                const payload = data.payload
                users = await User
                    .find(payload)
                    .select("-password -refreshToken")
                    .sort(data.sortOptions)
                    .lean()
                if (!users?.length)
                    return res.status(404).json({message: "Нема користувачів"})

                await usersHistory(users)
                return res.status(200).json({users: users})
            }
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

adminRouter.get("/reviews", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const reviews = await Review
                .find()
                .lean()
            await reviewsSenders(reviews)
            return res.status(200).json({reviews: reviews})
        } else {
            const ids = await convertToArray(id)
            const reviews = await Review.find({_id: {$in: ids}}).lean()
            if (!reviews?.length)
                return res.status(404).json({error: "Нема Відгуків"})

            return res.status(201).json({reviews: reviews})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/export", adminValidator, async (req, res) => {
    let {id, collection} = req.query
    try {
        if (!collection)
            return res.status(400).json({error: 'Вкажіть назву колонки'})

        const csv = await export2csvSystem(id, collection)
        res.header('Content-Type', 'text/csv')
        res.attachment(`${collection}.csv`)
        return res.send(csv)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/posts", adminValidator, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const {id} = req.query
    try {
        if (!id) {
            const data = await filterSystem(req.query)
            const totalProducts = await Blog.countDocuments()
            const posts = await Blog.find(data.payload)
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            return res.status(200).json({
                posts: posts, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const post = await Blog.findById(id).lean()
            return res.status(200).json({post: post})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get('/orders', adminValidator, async (req, res) => {
    const {id} = req.query
    const page = parseInt(req.query.page) || 1

    try {
        if (!id) {
            const data = await filterSystem(req.query)
            const totalProducts = await Order.countDocuments()
            const orders = await Order
                .find(data.payload)
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!orders.length)
                return res.status(404).json({message: "Нема замовлень"})

            return res.status(200).json({
                orders: orders, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const order = await Order.findById(id).lean()
            if (!order)
                return res.status(404).json({error: 'Нема замовлень'})

            await orderProducts(order)

            return res.status(200).json({order: order})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/packs", adminValidator, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const {id} = req.query
    try {
        if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined)
            return res.status(400).json({error: "Потрібно вказати або категорію,або підкатегорію"})
        if (!id) {
            const data = await filterSystem(req.query)
            const totalPacks = await Pack.countDocuments()
            const packs = await Pack.find(data.payload)
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!packs.length) return res.status(404).json({error: "Нема паків"})
            await packProducts(packs)
            return res.status(200).json({
                packs: packs, currentPage: page, totalPages: Math.ceil(totalPacks / perPage)
            })
        } else {
            const pack = await Pack
                .findById(id)
                .lean()
            await packProducts([pack])
            if (!pack) return res.status(404).json({error: "Нема Паків"})
            return res.status(200).json({pack: pack})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/products", adminValidator, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const id = req.query.id

    try {
        if (!id) {
            if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined)
                return res.status(400).json({error: "Потрібно вказати або категорію,або підкатегорію"})

            const data = await filterSystem(req.query)
            const totalProducts = await Product.countDocuments()
            const products = await Product.find(data.payload)
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()

            if (!products.length) return res.status(404).json({message: "Нема продуктів"})

            await productReviews(products)
            await productCategory(products)

            return res.status(200).json({
                products: products, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const product = await Product.findOne({_id: id}).lean()
            if (!product) return res.status(404).json({error: "Нема продуктів"})
            await productReviews([product])
            await productCategory([product])
            if (!product)
                return res.status(404).json({message: "Нема продуктів"})

            return res.status(200).json({product: product})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
adminRouter.post("/create", async (req, res) => {
    const {username, password} = req.body
    try {
        const admin = await Admin.findOne({username: username})

        if (admin)
            return res.status(400).json({error: "Такий адмін існує вже"})

        const newAdmin = new Admin({
            username: username,
            password: await passwordHash(password)
        })

        const AT = adminTokenAssign(newAdmin)

        await newAdmin.save()

        return res.status(201).json({
            message: "Успішно створено",
            accessToken: AT,
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/login", async (req, res) => {
    const {username, password} = req.body
    try {
        if (!username || !password)
            return res.status(400).json({error: "Fill all inputs"})

        const admin = await Admin.findOne({username: username})

        if (!admin)
            return res.status(400).json({error: "Invalid Username or Password"})

        if (!await passwordCompare(admin.password, password))
            return res.status(400).json({error: "Invalid Username or Password"})

        const AT = adminTokenAssign(admin)

        return res.status(201).json({
            message: "Successfully",
            accessToken: AT
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post('/posts', adminValidator, async (req, res) => {
    const {title, text, image, video, sections, subSections, display} = req.body

    try {
        const newPost = new Blog({
            title: title,
            text: text,
            image: image,
            video: video,
            sections: sections,
            subSections: subSections,
            display: display
        })
        await newPost.save()
        return res.status(201).json({message: 'Post created successfully', post: newPost})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/packs", adminValidator, async (req, res) => {
    const {
        image,
        article,
        packName,
        price,
        sectionId,
        subSectionId,
        products,
        display,
        video,
        description,
        quantity
    } = req.body
    try {
        // await authenticateB2()
        const result = await chooseSection(sectionId, subSectionId)

        // await image.save()

        const pack = new Pack({
            image: image,
            article: article,
            packName: packName,
            price: price,
            section: result,
            products: products,
            display: display,
            video: video,
            description: description,
            quantity: quantity
        })

        await pack.save()
        const updated = await Section.updateOne({_id: result}, {$push: {packs: pack}})
        if (updated.modifiedCount < 1) await SubSection.updateOne({_id: result}, {$push: {packs: pack}})
        return res.status(201).json({pack: pack})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/products", adminValidator, async (req, res) => {
    const {
        image, name, price, article, description, sectionId, subSectionId, promotion, quantity, video, display
    } = req.body
    try {
        const result = await chooseSection(sectionId, subSectionId)

        const product = new Product({
            image: image,
            name: name,
            price: price,
            article: article,
            description: description,
            promotion: promotion,
            quantity: quantity,
            section: result,
            video: video,
            display: display
        })

        if (sectionId) {
            await Section.updateOne({_id: sectionId}, {$push: {products: product._id}})
        } else if (subSectionId) {
            await SubSection.updateOne({_id: subSectionId}, {$push: {products: product._id}})
        } else return res.status(400).json({error: "You can't assign product to Section and SubSection"})

        await product.save()
        return res.status(201).json({
            message: "Successfully created", product: product
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/sections", adminValidator, async (req, res) => {
    const {image, name, subSections, products, packs} = req.body
    try {
        if (subSections?.length > 0) subSections.forEach(subSection => new mongoose.Types.ObjectId(subSection))

        if (products?.length > 0) products.forEach(product => new mongoose.Types.ObjectId(product))

        const section = new Section({
            image: image, name: name, subSections: subSections, products: products, packs: packs
        })

        await section.save()

        return res.status(201).json({
            message: "Successfully created", section: section
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/subsections", adminValidator, async (req, res) => {
    const {image, name, products, packs} = req.body
    const {id} = req.query
    try {
        if (!id)
            return res.status(404).json({error: "Section not found"})

        const subSection = new SubSection({
            image: image, name: name, products: products, packs: packs
        })

        await subSection.save()

        const updated = await Section.updateOne(
            {_id: id},
            {$push: {subSections: subSection._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "SubSection not created"})

        return res.status(201).json({
            message: "Successfully created", subSection: subSection
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
adminRouter.put("/reviews", adminValidator, async (req, res) => {
    const id = req.query.id
    const {replyText} = req.body
    try {
        if (!id) {
            return res.status(404).json({error: "Review not found"})
        } else if (!replyText) {
            return res.status(400).json({error: "Fill the inputs"})
        } else {
            const updated = await Review.updateOne(
                {_id: id},
                {
                    $push: {
                        'content.reply': {
                            replySenderId: req.adminId,
                            replyText: replyText,
                            repliedAt: Date.now()

                        },
                    }
                }
            )

            if (updated.modifiedCount < 1)
                return res.status(400).json({error: "Not Replied"})

            return res.status(201).json({message: "Answered"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/calls", async (req, res) => {
    const {phone, text} = req.body
    try {
        const validatedPhone = await validatePhone(phone)
        if (!validatedPhone)
            return res.status(400).json({error: "Send correct phone number"})

        const call = {
            phone: phone,
            text: text
        }

        await Admin.updateOne({}, {$push: {calls: call}})
        return res.status(201).json({message: "We will call you"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put('/posts', adminValidator, async (req, res) => {
    const {id} = req.query
    const {title, text, image, video, sections, display} = req.body
    try {
        await Blog.updateOne(
            {_id: id},
            {
                $set: {title, text, video, sections, display},
                $push: {image: image}
            }
        )
        return res.status(200).json({message: 'Post updated successfully'})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/orders", adminValidator, orderUpdateValidator, async (req, res) => {
    try {
        const order = req.order
        const updatedFields = req.updatedFields

        Object.assign(order, updatedFields)

        await order.save()

        return res.status(201).json({message: "Order updated successfully", order: order})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/packs", adminValidator, packUpdateValidator, async (req, res) => {
    try {
        const {id} = req.query
        const {sectionId, subSectionId} = req.body
        const {updatedFields, pack} = req

        if (sectionId && sectionId !== pack.section.toString()) {
            const oldSection = pack.section
            await Section.updateOne(
                {_id: oldSection},
                {$pull: {packs: pack._id}}
            );
            await SubSection.updateOne(
                {_id: oldSection},
                {$pull: {packs: pack._id}}
            );
        }
        const updatedPack = await Pack.findByIdAndUpdate(id, updatedFields);
        if (!updatedPack) return res.status(404).json({error: "Нема такого паку"});

        const newSection = await chooseSection(sectionId, subSectionId)
        if (newSection && newSection !== updatedPack.section) {
            const sectionUpdate = await Section.updateOne(
                {_id: newSection},
                {$addToSet: {packs: updatedPack._id}}
            );
            if (sectionUpdate.modifiedCount < 1) {
                await SubSection.updateOne(
                    {_id: newSection},
                    {$addToSet: {packs: updatedPack._id}}
                );
            }
        }
        return res.status(200).json({message: "Пак оновлено"});
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/products", adminValidator, productUpdateValidator, async (req, res) => {
    try {
        const {history, ...payload} = req.product

        return res.status(200).json({
            message: "Product successfully updated", product: payload, changes: req.editHistory
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/promotion", adminValidator, async (req, res) => {
        const {discount, isActive} = req.body
        const {id} = req.query
        try {
            if (!id) return res.status(404).json({error: "Section not found"})
            const section = await Section.findById(id).select('products').lean()
            const products = await Product.find({_id: {$in: section.products}}).select('price promotion').lean()

            const bulkOperations = products.map(product => {
                const newPrice = discount ? product.price * discount : product.promotion.newPrice
                return {
                    updateOne: {
                        filter: {_id: product._id}, update: {
                            $set: {
                                'promotion.isActive': isActive, ...(discount && {'promotion.newPrice': newPrice})
                            }
                        }
                    }
                }
            })
            await Product.bulkWrite(bulkOperations)
            return res.status(200).json({message: "Products updated successfully"})
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

//DELETE
adminRouter.delete("/users", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await User.deleteMany()
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await User.deleteMany({_id: {$in: ids}})
            return res.status(201).json({message: "Deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete("/orders", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Order.deleteMany()
            await User.updateMany({}, {$pull: {history: {$in: []}}})
            return res.status(201).json({message: "All orders deleted"})
        } else {
            const ids = await convertToArray(id)
            await Order.deleteMany({_id: {$in: ids}})
            await User.updateMany({}, {$pull: {history: {$in: ids}}})
            return res.status(201).json({message: "Order deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete('/posts', adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Blog.deleteMany()
            return res.status(201).json({message: 'Post deleted successfully'})
        } else {
            const ids = await convertToArray(id)
            await Blog.deleteMany({_id: {$in: ids}})
            return res.status(201).json({message: 'Post deleted successfully'})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete('/packs', adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Pack.deleteMany()
            await Section.updateMany({}, {$set: {packs: []}})
            await SubSection.updateMany({}, {$set: {packs: []}})
            return res.status(201).json({message: 'All Packs Deleted'})
        } else {
            const ids = await convertToArray(id)
            await Pack.deleteMany({_id: {$in: ids}})
            await Section.updateMany({packs: {$in: ids}}, {$pull: {packs: {$in: ids}}})
            await SubSection.updateMany({packs: {$in: ids}}, {$pull: {packs: {$in: ids}}})
            return res.status(201).json({message: 'Packs Deleted Successfully'})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete("/products", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Product.deleteMany()
            await Section.updateMany({}, {$pull: {products: {$in: []}}})
            await SubSection.updateMany({}, {$pull: {products: {$in: []}}})
            return res.status(201).json({message: "All products deleted"})
        } else {
            const ids = await convertToArray(id)
            await Section.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await SubSection.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await Product.deleteMany({_id: {$in: ids}})
            return res.status(201).json({message: "Product deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete("/reviews", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Review.deleteMany()
            await Product.updateMany({}, {$pull: {reviews: {$in: []}}})
        } else {
            const ids = await convertToArray(id)
            await Review.deleteMany({_id: {$in: ids}})
            await Product.updateMany({_id: {$in: ids}}, {$pull: {reviews: {$in: ids}}})
        }
        return res.status(201).json({message: "Successfully deleted"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete("/sections", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Section.deleteMany()
            await Product.updateMany({}, {$set: {section: null}})
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await Section.deleteMany({_id: {$in: ids}})
            await Product.updateMany({section: {$in: ids}}, {$set: {section: null}})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.delete("/subsections", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await SubSection.deleteMany()
            await Section.updateMany({}, {$set: {subSections: []}})
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await SubSection.deleteMany({_id: {$in: ids}})
            await Section.updateMany({subSections: {$in: ids}}, {$pull: {subSections: {$in: ids}}})
            return res.status(201).json({message: "Deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = adminRouter