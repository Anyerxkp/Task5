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

// The rest of your code remains unchanged

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = app;
