document.addEventListener('DOMContentLoaded', () => {
    const token = window.getAuthToken();
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadTodos();
    setupEventListeners();

    const userName = localStorage.getItem('user_name');
    if (userName && document.getElementById('userName')) {
        document.getElementById('userName').textContent = userName;
    }
});

const API_URL = '/todos';

function getHeaders() {
    const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function setupEventListeners() {
    // Add Todo Form
    document.getElementById('addTodoForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('todoTitle').value;
        const priority = document.getElementById('todoPriority').value;
        const dueDate = document.getElementById('todoDueDate').value;

        try {
            const response = await fetch(API_URL + '/', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    title,
                    priority,
                    due_date: dueDate || null
                })
            });

            if (response.ok) {
                document.getElementById('addTodoForm').reset();
                loadTodos(); // Refresh list
                // Optional: Show success message/toast
            } else {
                alert('Failed to add todo');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    });

    // Filter Tabs
    document.querySelectorAll('.tab').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            loadTodos(button.dataset.filter);
        });
    });
}

async function loadTodos(filterStatus = 'all') {
    try {
        let url = API_URL + '/';
        if (filterStatus !== 'all') {
            url += `?status=${filterStatus}`;
        }

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (response.ok) {
            const todos = await response.json();
            renderTodos(todos);
        } else {
            window.handleAuthError(response);
        }
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

function renderTodos(todos) {
    const list = document.getElementById('todoList');
    list.innerHTML = '';

    if (todos.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888; margin-top:20px;">No tasks found.</div>';
        return;
    }

    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item priority-${todo.priority} ${todo.status === 'Completed' ? 'completed' : ''}`;

        const dateStr = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'No Due Date';

        item.innerHTML = `
            <input type="checkbox" class="todo-checkbox" 
                ${todo.status === 'Completed' ? 'checked' : ''} 
                onchange="toggleTodoStatus(${todo.id}, this.checked)">
            
            <div class="todo-content">
                <div class="todo-title">${todo.title}</div>
                <div class="todo-meta">
                    <span class="badge badge-${todo.priority.toLowerCase()}">${todo.priority}</span>
                    • ${dateStr}
                </div>
            </div>

            <div class="todo-actions">
                <button onclick="deleteTodo(${todo.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function toggleTodoStatus(id, isCompleted) {
    const status = isCompleted ? 'Completed' : 'Pending';
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        });
        // We can reload or just animate the change. Reloading ensures sort order correctness if needed.
        const currentFilter = document.querySelector('.tab.active').dataset.filter;
        loadTodos(currentFilter);
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const currentFilter = document.querySelector('.tab.active').dataset.filter;
        loadTodos(currentFilter);
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}
