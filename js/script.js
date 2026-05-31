const startBtn = document.getElementById("startBtn");
const readBtn = document.getElementById("readBtn");
const output = document.getElementById("output");
const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const allBtn = document.getElementById("allBtn");
const activeBtn = document.getElementById("activeBtn");
const completedBtn = document.getElementById("completedBtn");
const nextTask = document.getElementById("nextTask");

let currentFilter = "all";

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function speak(text) {
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "en-IE";
    window.speechSynthesis.speak(message);
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IE", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getDueDate(text) {
  const lowerText = text.toLowerCase();
  const today = new Date();

  if (lowerText.includes("tomorrow")) {
    today.setDate(today.getDate() + 1);
    return today.toISOString();
  }

  if (lowerText.includes("today")) {
    return today.toISOString();
  }

  return null;
}

function getDueTime(text) {
  const lowerText = text.toLowerCase();

  const match = lowerText.match(/at (\d{1,2})(:\d{2})?/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  let minutes = match[2] ? match[2].replace(":", "") : "00";

  return `${hour}:${minutes}`;
}


function sortTasks() {
  tasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

function getPriority(text) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("urgent") ||
    lowerText.includes("important") ||
    lowerText.includes("high priority")
  ) {
    return "High";
  }

  if (
    lowerText.includes("low priority") ||
    lowerText.includes("not urgent")
  ) {
    return "Low";
  }

  return "Medium";
}

function getFilteredTasks() {
  if (currentFilter === "active") {
    return tasks.filter(task => !task.done);
  }

  if (currentFilter === "completed") {
    return tasks.filter(task => task.done);
  }

  return tasks;
}

function getDueStatus(task) {
  if (!task.dueDate) {
    return "";
  }

  const now = new Date();
  const dueDate = new Date(task.dueDate);

  if (dueDate.toDateString() === now.toDateString()) {
    return "Due today";
  }

  if (dueDate < now) {
    return "Overdue";
  }

  return "";
}

function getTaskDateTime(task) {
  if (!task.dueDate) {
    return null;
  }

  const date = new Date(task.dueDate);

  if (task.dueTime) {
    const [hour, minute] = task.dueTime.split(":");
    date.setHours(Number(hour), Number(minute), 0, 0);
  }

  return date;
}

function showNextTask() {
  const activeTasks = tasks.filter(task => task.done !== true);

  if (activeTasks.length === 0) {
    nextTask.textContent = "No active tasks.";
    return;
  }

  activeTasks.sort((a, b) => {
    const dateA = getTaskDateTime(a);
    const dateB = getTaskDateTime(b);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA - dateB;
  });

  nextTask.textContent = activeTasks[0].text;
}


function showTasks() {
    sortTasks();
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = "<p>No tasks yet.</p>";
    showNextTask();
    return;
  }

  getFilteredTasks().forEach((task, index) => {

    const item = document.createElement("li");
    item.className = "task";

    const statusText = getDueStatus(task);

    if (statusText === "Overdue") {
      item.classList.add("overdue");
    }

    if (statusText === "Due today") {
      item.classList.add("due-today");
    }

    if (task.done) {
      item.classList.add("completed");
    }

    const left = document.createElement("div");
    left.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      refreshUI();
    });

    const textBox = document.createElement("div");

    const text = document.createElement("div");
    text.className = "task-text";
    text.textContent = task.text;

    const date = document.createElement("div");
    date.className = "task-date";
    date.textContent = "Created: " + formatDate(task.createdAt);

    if (task.dueDate) {
      const due = document.createElement("div");
      due.className = "task-date";
      due.textContent = " | Due: " + formatDate(task.dueDate);
      textBox.appendChild(due);
    }

    if (task.dueTime) {
      const time = document.createElement("div");
      time.className = "task-date";
      time.textContent = " | Time: " + task.dueTime;
      textBox.appendChild(time);
    }

    textBox.appendChild(text);
    textBox.appendChild(date);

    const priority = document.createElement("div");
    priority.className = "task-date";
    priority.textContent = "Priority: " + task.priority;
    textBox.appendChild(priority);

    if (statusText !== "") {
      const status = document.createElement("div");
      status.className = "task-date";
      status.textContent = "Status: " + statusText;
      textBox.appendChild(status);
    }

    left.appendChild(checkbox);
    left.appendChild(textBox);

    const editBtn = document.createElement("button");
editBtn.className = "delete-btn";
editBtn.textContent = "Edit";

editBtn.addEventListener("click", () => {
  const newText = prompt("Edit task:", task.text);

  if (newText === null) {
    return;
  }

  const cleanedText = newText.trim();

  if (cleanedText === "") {
    return;
  }

  task.text = cleanTaskText(cleanedText);
  task.dueDate = getDueDate(cleanedText);
  task.dueTime = getDueTime(cleanedText);
  task.priority = getPriority(cleanedText);
  task.category = getCategory(cleanedText);

  saveTasks();
  refreshUI();
});


    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      refreshUI();
    });

    item.appendChild(left);
    item.appendChild(editBtn);
    item.appendChild(deleteBtn);
    taskList.appendChild(item);
  });
}

function addTask(text) {
  const newTask = {
    text: cleanTaskText(text),
    done: false,
    createdAt: new Date().toISOString(),
    dueDate: getDueDate(text),
    dueTime: getDueTime(text),
    priority: getPriority(text),
    category: getCategory(text)
  };

  tasks.push(newTask);
  saveTasks();
  refreshUI();
}

function cleanTaskText(text) {
    return text
        .replace(/tomorrow/gi, "")
        .replace(/today/gi, "")
        .replace(/at \d{1,2}(:\d{2})?/gi, "")
        .trim();
}

function getCategory(text) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("study") ||
    lowerText.includes("homework") ||
    lowerText.includes("revise") ||
    lowerText.includes("assignment")
  ) {
    return "Study";
  }

  if (
    lowerText.includes("buy") ||
    lowerText.includes("shopping") ||
    lowerText.includes("milk") ||
    lowerText.includes("groceries")
  ) {
    return "Shopping";
  }


  if (
    lowerText.includes("doctor") ||
    lowerText.includes("appointment") ||
    lowerText.includes("hospital")
  ) {
    return "Health";
  }

  return "General";
}

function refreshUI() {
  showTasks();
  showNextTask();
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  output.textContent = "Speech recognition is not supported in this browser.";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IE";
  recognition.continuous = false;

  startBtn.addEventListener("click", () => {
    recognition.start();
    output.textContent = "Listening...";
  });

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;

    output.textContent = spokenText;

    addTask(spokenText);
    speak("Task added: " + spokenText);
  };

  recognition.onerror = (event) => {
    output.textContent = "Error: " + event.error;
  };
}

readBtn.addEventListener("click", () => {
  if (tasks.length === 0) {
    speak("You have no tasks.");
    return;
  }

  const unfinishedTasks = tasks.filter(task => !task.done);

  if (unfinishedTasks.length === 0) {
    speak("All your tasks are completed.");
    return;
  }

  const taskText = unfinishedTasks
    .map((task, index) => `Task ${index + 1}: ${task.text}`)
    .join(". ");

  speak("Here are your tasks. " + taskText);
});

allBtn.onclick = () => {
  currentFilter = "all";
  showTasks();
};

activeBtn.onclick = () => {
  currentFilter = "active";
  showTasks();
};

completedBtn.onclick = () => {
  currentFilter = "completed";
  showTasks();
};

addTaskBtn.addEventListener("click", () => {
  const typedText = taskInput.value.trim();

  if (typedText === "") {
    return;
  }

  addTask(typedText);
  taskInput.value = "";
    });

showTasks();
showNextTask();
