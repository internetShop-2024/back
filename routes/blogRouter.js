const blogRouter = require('express').Router()
const Blog = require('../models/blogModel')
const adminValidator = require("../validators/adminValidator");
const {convertToArray} = require("../vars/functions");

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

//POST
blogRouter.post('/', adminValidator, async (req, res) => {
    const {title, text, image, sections, subSections} = req.body

    try {
        const newPost = new Blog({
            title: title,
            text: text,
            image: image,
            sections: sections,
            subSections: subSections
        })
        await newPost.save()
        return res.status(201).json({message: 'Post created successfully', post: newPost})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
blogRouter.put('/', adminValidator, async (req, res) => {
    const {id} = req.query
    const {title, text, image, sections, display} = req.body
    try {
        const updatedPost = await Blog.findByIdAndUpdate(
            id,
            {title, text, image, sections, display},
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

//DELETE
blogRouter.delete('/', adminValidator, async (req, res) => {
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

module.exports = blogRouter
