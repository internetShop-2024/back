const blogRouter = require('express').Router()
const Blog = require('../models/blogModel')

//GET
blogRouter.get('/', async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const posts = await Blog.find({display: true})
            return res.status(200).json({posts: posts})
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
