const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const redis = require('redis');
const { promisify } = require('util');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize Redis client
const redisClient = redis.createClient();
const redisGetAsync = promisify(redisClient.get).bind(redisClient);
const redisSetAsync = promisify(redisClient.set).bind(redisClient);

mongoose.connect('mongodb://127.0.0.1:27017/todo', { useNewUrlParser: true, useUnifiedTopology: true });

const todoSchema = new mongoose.Schema({
  _id: { type: String, default: shortid.generate },
  title: String,
  description: String,
  completed: Boolean
});

const Todo = mongoose.model('Todo', todoSchema);

// GET all todos with Redis caching
app.get('/todos', async (req, res) => {
  try {
    const cachedTodos = await redisGetAsync('todos');
    
    if (cachedTodos) {
      console.log('Serving from cache');
      res.json(JSON.parse(cachedTodos));
    } else {
      const todos = await Todo.find();
      await redisSetAsync('todos', JSON.stringify(todos), 'EX', 60); // Cache for 60 seconds
      console.log('Serving from database');
      res.json(todos);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new todo with validation
app.post('/todos', [
  check('title').notEmpty().withMessage('Title is required'),
  check('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description } = req.body;
  const newTodo = new Todo({ title, description, completed: false });

  try {
    await newTodo.save();
    await redisClient.del('todos'); // Clear the cache
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) a todo by ID with validation
app.put('/todos/:id', [
  check('title').notEmpty().withMessage('Title is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('completed').isBoolean().withMessage('Completed must be a boolean value')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, completed } = req.body;

  try {
    const updatedTodo = await Todo.findByIdAndUpdate(id, { title, description, completed }, { new: true });
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    await redisClient.del('todos'); // Clear the cache
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a todo by ID
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTodo = await Todo.findByIdAndDelete(id);
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    await redisClient.del('todos'); // Clear the cache
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = app;

