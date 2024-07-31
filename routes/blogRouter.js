const blogRouter = require('express').Router()
const Blog = require('../models/blogModel')
//GET
blogRouter.get('/', async (req, res) => {
    try {
        const posts = await Blog.find({display: true})
        return res.status(200).json(posts)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

blogRouter.get('/post/:id', async (req, res) => {
    const {id} = req.params

    try {
        const post = await Blog.findById(id)
        if (!post) {
            return res.status(404).json({error: 'Post not found'})
        }
        return res.status(200).json(post)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
blogRouter.post('/post', async (req, res) => {
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
blogRouter.put('/post/:id', async (req, res) => {
    const {id} = req.params
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
blogRouter.delete('/post/:id', async (req, res) => {
    const {id} = req.params

    try {
        const deletedPost = await Blog.findByIdAndDelete(id)
        if (!deletedPost) {
            return res.status(404).json({error: 'Post not found'})
        }
        return res.status(200).json({message: 'Post deleted successfully'})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = blogRouter
