const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('./index'); // Assuming your main file is named 'index.js'

const { expect } = chai;

chai.use(chaiHttp);

describe('Todo API', () => {
  let createdTodoId;

  it('should get all todos', (done) => {
    chai.request(app)
      .get('/todos')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should create a new todo', (done) => {
    const todo = {
      title: 'Test Todo',
      description: 'This is a test todo',
    };

    chai.request(app)
      .post('/todos')
      .send(todo)
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('title').eql(todo.title);
        expect(res.body).to.have.property('description').eql(todo.description);
        createdTodoId = res.body._id; // Store the created todo ID
        done();
      });
  });

  it('should update a todo by id', (done) => {
    const updatedTodo = {
      title: 'Updated Test Todo',
      description: 'This is an updated test todo',
      completed: true,
    };

    chai.request(app)
      .put(`/todos/${createdTodoId}`)
      .send(updatedTodo)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('title').eql(updatedTodo.title);
        expect(res.body).to.have.property('description').eql(updatedTodo.description);
        expect(res.body).to.have.property('completed').eql(updatedTodo.completed);
        done();
      });
  });

  it('should delete a todo by id', (done) => {
    chai.request(app)
      .delete(`/todos/${createdTodoId}`)
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  });

  it('should return a 404 when trying to update a non-existent todo', (done) => {
    const updatedTodo = {
      title: 'Updated Test Todo',
      description: 'This is an updated test todo',
      completed: true,
    };

    chai.request(app)
      .put('/todos/non_existent_id')
      .send(updatedTodo)
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error').eql('Todo not found');
        done();
      });
  });

  it('should return a 404 when trying to delete a non-existent todo', (done) => {
    chai.request(app)
      .delete('/todos/non_existent_id')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error').eql('Todo not found');
        done();
      });
  });

});

