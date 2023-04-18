import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Button, Form, ListGroup, Alert } from "react-bootstrap";
import TodoItem from "./components/TodoItem";

const App = () => {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const fetchTodos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/todos");
      setTodos(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/todos", { title, description });
      fetchTodos();
      setTitle("");
      setDescription("");
      setError(null);
    } catch (error) {
      setError(error.response.data.errors[0].msg);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/todos/${id}`);
      fetchTodos();
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const updateTodo = async (id, updatedTitle, updatedDescription, updatedCompleted) => {
    try {
      await axios.put(`http://localhost:3000/todos/${id}`, {
        title: updatedTitle,
        description: updatedDescription,
        completed: updatedCompleted,
      });
      fetchTodos();
      setError(null);
    } catch (error) {
      setError(error.response.data.errors[0].msg);
    }
  };

  return (
    <Container>
      <Row className="mt-4">
        <Col>
          <h1>Todo List</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          <Form onSubmit={addTodo}>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit">Add Todo</Button>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          <ListGroup>
            {todos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
