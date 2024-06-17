document.addEventListener('DOMContentLoaded', () => {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoDueDate = document.getElementById('todo-due-date');
  const todoPriority = document.getElementById('todo-priority');
  const todoList = document.getElementById('todo-list');
  const filterButtons = document.querySelectorAll('.filters button');
  const searchInput = document.getElementById('search-input');
  const clearCompletedButton = document.getElementById('clear-completed');

  let todos = JSON.parse(localStorage.getItem('todos')) || [];
  let editMode = false;
  let editedIndex = -1;

  function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
  }

  function renderTodos(filter = 'all', searchQuery = '') {
    todoList.innerHTML = '';
    let filteredTodos = todos;
    if (filter === 'completed') {
      filteredTodos = todos.filter(todo => todo.completed);
    } else if (filter === 'pending') {
      filteredTodos = todos.filter(todo => !todo.completed);
    }

    if (searchQuery) {
      filteredTodos = filteredTodos.filter(todo =>
        todo.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filteredTodos.forEach((todo, index) => {
      const li = createTodoElement(todo, index); // Create li element for each todo
      todoList.appendChild(li);
    });
  }

  function createTodoElement(todo, index) {
    const li = document.createElement('li');
    const currentDate = new Date();
    const dueDate = new Date(todo.dueDate);

    // Check if task is overdue or due today
    if (dueDate < currentDate) {
      li.classList.add('overdue');
    } else {
      const timeDifference = dueDate.getTime() - currentDate.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
      if (daysDifference <= 2) { // Highlight if due within next 2 days
        li.classList.add('due-soon');
      }
    }

    li.innerHTML = `
      <span>${todo.text} (Due: ${todo.dueDate}, Priority: ${todo.priority})</span>
      <div>
        <button class="edit-button">Edit</button>
        <button class="delete-button">Delete</button>
      </div>
    `;
    li.className += todo.completed ? ' completed' : '';

    li.addEventListener('dblclick', () => {
      todo.completed = !todo.completed;
      saveTodos();
      renderTodos();
    });

    const deleteButton = li.querySelector('.delete-button');
    deleteButton.addEventListener('click', e => {
      e.stopPropagation();
      todos = todos.filter(t => t !== todo);
      saveTodos();
      renderTodos();
    });

    const editButton = li.querySelector('.edit-button');
    editButton.addEventListener('click', e => {
      e.stopPropagation();
      editMode = true;
      editedIndex = index;
      setEditMode(todo);
    });

    li.draggable = true; // Enable draggable attribute

    li.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', index); // Store index of dragged item
      setTimeout(() => li.classList.add('hide'), 0); // Hide element after drag starts
    });

    li.addEventListener('dragend', () => {
      setTimeout(() => li.classList.remove('hide'), 0); // Show element after drag ends
    });

    return li;
  }

  function setEditMode(todo) {
    todoInput.value = todo.text;
    todoDueDate.value = todo.dueDate;
    todoPriority.value = todo.priority;
    todoForm.querySelector('button[type="submit"]').textContent = 'Edit Task';
  }

  function clearEditMode() {
    editMode = false;
    editedIndex = -1;
    todoForm.reset();
    todoForm.querySelector('button[type="submit"]').textContent = 'Add';
  }

  todoForm.addEventListener('submit', e => {
    e.preventDefault();
    if (editMode) {
      todos[editedIndex].text = todoInput.value;
      todos[editedIndex].dueDate = todoDueDate.value;
      todos[editedIndex].priority = todoPriority.value;
      editMode = false;
    } else {
      const newTodo = {
        text: todoInput.value,
        dueDate: todoDueDate.value,
        priority: todoPriority.value,
        completed: false
      };
      todos.push(newTodo);
    }
    saveTodos();
    renderTodos();
    clearEditMode();
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.id;
      renderTodos(filter, searchInput.value);
    });
  });

  searchInput.addEventListener('input', () => {
    renderTodos(document.querySelector('.filters .active').id, searchInput.value);
  });

  clearCompletedButton.addEventListener('click', () => {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
  });

  todoList.addEventListener('dragover', e => {
    e.preventDefault(); // Allow drop
    const draggingIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const overIndex = getIndexUnderCursor(todoList, e.clientY);
    if (draggingIndex !== overIndex) {
      const removedTodo = todos.splice(draggingIndex, 1)[0];
      todos.splice(overIndex, 0, removedTodo);
      saveTodos();
      renderTodos();
    }
  });

  function getIndexUnderCursor(list, y) {
    const rect = list.getBoundingClientRect();
    const index = Math.floor((y - rect.top) / list.firstChild.offsetHeight);
    return Math.max(0, Math.min(index, todos.length - 1));
  }

  renderTodos(); // Initial render of todos
});
