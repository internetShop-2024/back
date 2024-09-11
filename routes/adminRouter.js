const adminRouter = require("express").Router()

const Admin = require("../models/adminModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Review = require("../models/reviewModel")
const Blog = require("../models/blogModel")
const Product = require("../models/productModel")
const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")

const adminValidator = require("../validators/adminValidator")
const productUpdateValidator = require("../validators/productUpdateValidator")

const {perPage} = require("../vars/publicVars")

const {
    passwordHash,
    adminTokenAssign,
    passwordCompare,
    convertToArray,
    filterSystem,
    export2csvSystem, validatePhone, orderProducts, productReviews, productCategory
} = require("../vars/functions")

//GET
adminRouter.get("/users", adminValidator, async (req, res) => {
        let {id, orderId} = req.query
        try {
            let users
            if (id && !orderId) {
                const user = await User.find({_id: id}).select('_id createdAt fullName phone email city history')
                if (!user)
                    return res.status(404).json({error: "User not found"})
                return res.status(200).json({user: user})
            } else if (id && orderId) {
                const user = await User.findById(id).select('phone').lean()
                const order = await Order.find({_id: orderId, phone: user.phone})
                return res.status(200).json({order: order})
            } else {
                const data = await filterSystem(req.query)
                const payload = data.payload
                users = await User.find(payload).select("-password -refreshToken -__v").sort(data.sortOptions)
                if (!users.length)
                    return res.status(404).json({message: "Not Found"})
                return res.status(200).json(users)
            }
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

adminRouter.get("/reviews", adminValidator, async (req, res) => {
    const id = req.query.id
    try {
        if (!id) {
            const reviews = await Review.find().lean()
            return res.status(200).json({reviews: reviews})
        } else {
            const review = await Review.findById(id).lean()
            if (!review)
                return res.status(404).json({error: "Review not found"})

            return res.status(201).json({review: review})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/export", adminValidator, async (req, res) => {
    let {id, collection} = req.query
    try {
        if (!collection)
            return res.status(400).json({error: 'Collection name is required'})

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
            const orders = await Order.find(data.payload)
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!orders.length)
                return res.status(404).json({message: "Orders Not Found"})

            return res.status(200).json({
                orders: orders, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const order = await Order.findById(id).lean()
            if (!order)
                return res.status(404).json({error: 'Order Not Found'})

            await orderProducts(order)

            return res.status(200).json({order: order})
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
                if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined) {
                    throw new Error("You must provide only one of sectionId or subSectionId")
                }

                const data = await filterSystem(req.query)
                const totalProducts = await Product.countDocuments()
                const products = await Product.find(data.payload)
                    .skip((page - 1) * perPage)
                    .limit(perPage)
                    .sort(data.sortOptions)
                    .lean()

                if (!products.length) return res.status(404).json({message: "Product Not Found"})

                await productReviews(products)
                await productCategory(products)

                return res.status(200).json({
                    products: products, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
                })
            } else {
                const product = await Product.findOne({_id: id}).lean()
                if (!product) return res.status(404).json({error: "Product not found"})
                await productReviews([product])
                await productCategory([product])
                if (!product)
                    return res.status(404).json({message: "Product not found"})

                return res.status(200).json({product: product})
            }
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

//POST
adminRouter.post("/create", async (req, res) => {
    const {username, password} = req.body
    try {
        if (!username || !password)
            return res.status(400).json({error: "Fill all inputs"})

        const admin = await Admin.findOne({username: username})

        if (admin)
            return res.status(400).json({error: "Already exist"})

        const newAdmin = new Admin({
            username: username,
            password: await passwordHash(password)
        })

        const AT = adminTokenAssign(newAdmin)

        await newAdmin.save()

        return res.status(201).json({
            message: "Successfully created",
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
    const {title, text, image, video, sections, subSections} = req.body

    try {
        const newPost = new Blog({
            title: title,
            text: text,
            image: image,
            video: video,
            sections: sections,
            subSections: subSections
        })
        await newPost.save()
        return res.status(201).json({message: 'Post created successfully', post: newPost})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/products", adminValidator, async (req, res) => {
    const {
        photo, name, price, article, description, sectionId, subSectionId, promotion, quantity, video
    } = req.body
    try {
        const result = (sectionId !== undefined && subSectionId !== undefined)
            ? (() => {
                throw new Error('Both sectionId and subSectionId are defined');
            })()
            : (sectionId !== undefined ? sectionId : subSectionId);

        const product = new Product({
            photo: photo,
            name: name,
            price: price,
            article: article,
            description: description,
            promotion: promotion,
            quantity: quantity,
            section: result,
            video: video
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
        console.log(e)
        return res.status(500).json({error: e})
    }
})

adminRouter.post("/sections", adminValidator, async (req, res) => {
    const {photo, name, subSections, products} = req.body
    try {
        if (subSections?.length > 0) subSections.forEach(subSection => new ObjectId(subSection))

        if (products?.length > 0) products.forEach(product => new ObjectId(product))

        const section = new Section({
            photo: photo, name: name, subSections: subSections, products: products
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
    const {name, products} = req.body
    const {id} = req.query
    try {
        if (!id)
            return res.status(404).json({error: "Section not found"})

        const subSection = new SubSection({
            name: name, products: products
        })

        const updated = await Section.updateOne(
            {_id: id},
            {$push: {subSections: subSection._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "SubSection not created"})

        await subSection.save()

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
                    $set: {
                        'content.reply': {
                            replySenderId: req.adminId,
                            replyText: replyText,
                            repliedAt: Date.now()

                        }
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
        const updatedPost = await Blog.findByIdAndUpdate(
            id,
            {title, text, image, video, sections, display},
            {new: true}
        )
        if (!updatedPost) {
            return res.status(404).json({error: 'Post not found'})
        }
        return res.status(200).json({message: 'Post updated successfully', post: updatedPost})
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

adminRouter.delete("/orders", adminValidator, async (req, res) => {
    const {id} = req.body
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
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await Section.deleteMany({_id: {$in: ids}})
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