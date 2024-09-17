const blogRouter = require('express').Router()
const Blog = require('../models/blogModel')

const {perPage} = require("../vars/publicVars")

//GET
blogRouter.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const {id} = req.query
    try {
        if (!id) {
            const totalPosts = await Blog.countDocuments()
            const posts = await Blog.find({display: true})
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
            return res.status(200).json({
                posts: posts, currentPage: page, totalPages: Math.ceil(totalPosts / perPage)
            })
        } else {
            const post = await Blog.findById(id)
            if (!post) {
                return res.status(404).json({error: 'Post not found'})
            }
            return res.status(200).json({post: post})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = blogRouter
