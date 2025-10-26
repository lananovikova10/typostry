# Code Blocks and Syntax Highlighting

This document demonstrates syntax highlighting for various programming languages.

## JavaScript / TypeScript

### JavaScript Example

```javascript
// Fibonacci sequence generator
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
for (let i = 0; i < 10; i++) {
  console.log(fib.next().value);
}
```

### TypeScript Example

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

class UserService {
  private users: Map<number, User> = new Map();

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(id: number): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

const service = new UserService();
service.addUser({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});
```

### React Component

```tsx
import React, { useState, useEffect } from 'react';

interface TodoProps {
  initialTodos?: string[];
}

export const TodoList: React.FC<TodoProps> = ({ initialTodos = [] }) => {
  const [todos, setTodos] = useState<string[]>(initialTodos);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <div className="todo-container">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, idx) => (
          <li key={idx}>{todo}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Python

### Data Science Example

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Load dataset
data = pd.read_csv('housing_data.csv')

# Feature engineering
X = data[['bedrooms', 'bathrooms', 'square_feet', 'age']]
y = data['price']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
score = model.score(X_test, y_test)

print(f"Model R² Score: {score:.4f}")
```

### Flask Web Server

```python
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    completed = db.Column(db.Boolean, default=False)

@app.route('/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'POST':
        data = request.get_json()
        task = Task(title=data['title'])
        db.session.add(task)
        db.session.commit()
        return jsonify({'id': task.id, 'title': task.title}), 201

    tasks = Task.query.all()
    return jsonify([{'id': t.id, 'title': t.title} for t in tasks])

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
```

## Java

### Spring Boot REST Controller

```java
package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User userDetails) {
        return userRepository.findById(id)
            .map(user -> {
                user.setName(userDetails.getName());
                user.setEmail(userDetails.getEmail());
                return ResponseEntity.ok(userRepository.save(user));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> {
                userRepository.delete(user);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
```

## Go

### HTTP Server with Goroutines

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "sync"
    "time"
)

type Task struct {
    ID        int       `json:"id"`
    Title     string    `json:"title"`
    Completed bool      `json:"completed"`
    CreatedAt time.Time `json:"created_at"`
}

type TaskStore struct {
    mu    sync.RWMutex
    tasks map[int]*Task
    nextID int
}

func NewTaskStore() *TaskStore {
    return &TaskStore{
        tasks: make(map[int]*Task),
        nextID: 1,
    }
}

func (s *TaskStore) Create(title string) *Task {
    s.mu.Lock()
    defer s.mu.Unlock()

    task := &Task{
        ID:        s.nextID,
        Title:     title,
        Completed: false,
        CreatedAt: time.Now(),
    }
    s.tasks[s.nextID] = task
    s.nextID++
    return task
}

func (s *TaskStore) GetAll() []*Task {
    s.mu.RLock()
    defer s.mu.RUnlock()

    tasks := make([]*Task, 0, len(s.tasks))
    for _, task := range s.tasks {
        tasks = append(tasks, task)
    }
    return tasks
}

func main() {
    store := NewTaskStore()

    http.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")

        switch r.Method {
        case "GET":
            json.NewEncoder(w).Encode(store.GetAll())
        case "POST":
            var req struct {
                Title string `json:"title"`
            }
            if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
            }
            task := store.Create(req.Title)
            json.NewEncoder(w).Encode(task)
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    })

    fmt.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Rust

### Async Web Server with Tokio

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;

#[derive(Clone, Debug)]
struct Task {
    id: u32,
    title: String,
    completed: bool,
}

type TaskStore = Arc<Mutex<HashMap<u32, Task>>>;

async fn handle_client(
    mut socket: tokio::net::TcpStream,
    store: TaskStore,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut buffer = [0; 1024];
    let n = socket.read(&mut buffer).await?;

    let request = String::from_utf8_lossy(&buffer[..n]);

    if request.starts_with("GET /tasks") {
        let tasks = store.lock().await;
        let response = serde_json::to_string(&*tasks)?;
        socket.write_all(response.as_bytes()).await?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let store: TaskStore = Arc::new(Mutex::new(HashMap::new()));
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    println!("Server running on port 8080");

    loop {
        let (socket, _) = listener.accept().await?;
        let store = Arc::clone(&store);

        tokio::spawn(async move {
            if let Err(e) = handle_client(socket, store).await {
                eprintln!("Error handling client: {}", e);
            }
        });
    }
}
```

## C++

### Modern C++ Example

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <algorithm>
#include <string>

template<typename T>
class SmartArray {
private:
    std::unique_ptr<T[]> data;
    size_t size_;

public:
    SmartArray(size_t size) : size_(size) {
        data = std::make_unique<T[]>(size);
    }

    T& operator[](size_t index) {
        if (index >= size_) {
            throw std::out_of_range("Index out of bounds");
        }
        return data[index];
    }

    const T& operator[](size_t index) const {
        if (index >= size_) {
            throw std::out_of_range("Index out of bounds");
        }
        return data[index];
    }

    size_t size() const { return size_; }

    void fill(const T& value) {
        std::fill(data.get(), data.get() + size_, value);
    }
};

int main() {
    SmartArray<int> arr(10);
    arr.fill(42);

    for (size_t i = 0; i < arr.size(); ++i) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

## Ruby

### Rails Model Example

```ruby
class User < ApplicationRecord
  has_many :posts, dependent: :destroy
  has_many :comments, through: :posts

  validates :email, presence: true, uniqueness: true
  validates :username, presence: true, length: { minimum: 3, maximum: 20 }

  before_save :downcase_email

  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }

  def full_name
    "#{first_name} #{last_name}"
  end

  def self.search(query)
    where("username LIKE ? OR email LIKE ?", "%#{query}%", "%#{query}%")
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end

# Usage
user = User.create(
  username: 'johndoe',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe'
)

recent_users = User.active.recent.limit(10)
```

## SQL

### Complex Database Query

```sql
-- Get top 10 customers with their total orders and revenue
WITH CustomerStats AS (
    SELECT
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(DISTINCT o.order_id) AS total_orders,
        SUM(oi.quantity * oi.unit_price) AS total_revenue,
        AVG(oi.quantity * oi.unit_price) AS avg_order_value
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
    GROUP BY c.customer_id, c.first_name, c.last_name, c.email
),
CustomerRank AS (
    SELECT
        *,
        RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank,
        DENSE_RANK() OVER (ORDER BY total_orders DESC) AS order_rank
    FROM CustomerStats
)
SELECT
    customer_id,
    CONCAT(first_name, ' ', last_name) AS customer_name,
    email,
    total_orders,
    ROUND(total_revenue, 2) AS total_revenue,
    ROUND(avg_order_value, 2) AS avg_order_value,
    revenue_rank
FROM CustomerRank
WHERE revenue_rank <= 10
ORDER BY total_revenue DESC;
```

## HTML/CSS

### Modern Web Component

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Component</title>
    <style>
        .card {
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 24px;
            max-width: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
        }

        .card-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .card-content {
            line-height: 1.6;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2 class="card-title">Beautiful Card</h2>
        <p class="card-content">
            This is a modern card component with gradient background
            and smooth hover effects.
        </p>
    </div>
</body>
</html>
```

## JSON

### API Response Example

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 12345,
      "username": "johndoe",
      "email": "john@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "Software developer and tech enthusiast"
      },
      "settings": {
        "notifications": true,
        "theme": "dark",
        "language": "en"
      },
      "metadata": {
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLogin": "2024-10-26T08:15:30Z",
        "verified": true
      }
    },
    "stats": {
      "posts": 156,
      "followers": 1234,
      "following": 567
    }
  },
  "timestamp": "2024-10-26T12:00:00Z"
}
```

## Shell Scripts

### Deployment Script

```bash
#!/bin/bash

set -e  # Exit on error

# Configuration
APP_NAME="my-app"
DEPLOY_DIR="/var/www/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"
LOG_FILE="/var/log/${APP_NAME}/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Create backup
log "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz" -C "$DEPLOY_DIR" . \
    || error "Backup failed"
success "Backup created"

# Pull latest code
log "Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main || error "Git pull failed"
success "Code updated"

# Install dependencies
log "Installing dependencies..."
npm ci --production || error "npm install failed"
success "Dependencies installed"

# Build application
log "Building application..."
npm run build || error "Build failed"
success "Build completed"

# Restart service
log "Restarting service..."
systemctl restart "${APP_NAME}" || error "Service restart failed"
success "Service restarted"

log "Deployment completed successfully!"
```

## Dockerfile

```dockerfile
# Multi-stage build for Node.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## End Notes

This document demonstrates syntax highlighting for:
- JavaScript/TypeScript (including React)
- Python (Data Science and Web)
- Java (Spring Boot)
- Go (Concurrent Programming)
- Rust (Async Programming)
- C++ (Modern C++)
- Ruby (Rails)
- SQL (Complex Queries)
- HTML/CSS
- JSON
- Shell Scripts
- Docker

All code blocks should have proper syntax highlighting with Shiki.
