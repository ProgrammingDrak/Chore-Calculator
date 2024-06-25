document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    updateDropdowns();
    updatePersonTaskList('person1');
    updatePersonTaskList('person2');
    createCustomTaskForm('task-bank');
    createCustomTaskForm('person1');
    createCustomTaskForm('person2');
    loadModifiers();
});

function initializeTasks() {
    const initialTasks = [
        { name: "After dinner clean up", description: "", time: 20, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Clean the half bathroom", description: "", time: 20, difficulty: "tier3", specialty: "rare", frequency: 0.25 },
        { name: "Clean the windows", description: "", time: 30, difficulty: "tier3", specialty: "rare", frequency: 0.025 },
        { name: "Deep Clean - Four Seasons Room", description: "", time: 15, difficulty: "tier1", specialty: "rare", frequency: 0.025 },
        { name: "Deep Clean - Kitchen", description: "", time: 15, difficulty: "tier1", specialty: "rare", frequency: 0.025 },
        { name: "Deep Clean - Living Room", description: "", time: 15, difficulty: "tier1", specialty: "rare", frequency: 0.025 },
        { name: "Deep Clean - Office", description: "", time: 10, difficulty: "tier1", specialty: "rare", frequency: 0.025 },
        { name: "Dust baseboards lower level", description: "", time: 30, difficulty: "tier3", specialty: "rare", frequency: 0.025 },
        { name: "Feed Griffin", description: "", time: 5, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "General Dusting lower level", description: "", time: 20, difficulty: "tier3", specialty: "frequent", frequency: 0.25 },
        { name: "General lower level vacuum", description: "", time: 25, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Machine laundry per load", description: "", time: 5, difficulty: "tier1", specialty: "frequent", frequency: 1 },
        { name: "Make Breakfast", description: "", time: 15, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Make Dinner", description: "", time: 45, difficulty: "tier2", specialty: "constant", frequency: 6 },
        { name: "Make Lunch", description: "", time: 20, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Make the bed", description: "", time: 5, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Meal Planning", description: "", time: 45, difficulty: "tier1", specialty: "frequent", frequency: 1 },
        { name: "Mise en Place", description: "", time: 25, difficulty: "tier2", specialty: "frequent", frequency: 6 },
        { name: "Mop lower level", description: "", time: 25, difficulty: "tier2", specialty: "frequent", frequency: 1 },
        { name: "Mow the back lawn", description: "", time: 45, difficulty: "tier3", specialty: "frequent", frequency: 0.3 },
        { name: "Mow the front lawn", description: "", time: 60, difficulty: "tier3", specialty: "frequent", frequency: 0.3 },
        { name: "Mow the side ones", description: "", time: 20, difficulty: "tier3", specialty: "frequent", frequency: 0.3 },
        { name: "Put away laundry", description: "", time: 15, difficulty: "tier1", specialty: "frequent", frequency: 1 },
        { name: "Reset the living room", description: "", time: 5, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Take out the compost", description: "", time: 5, difficulty: "tier1", specialty: "frequent", frequency: 1 },
        { name: "Take out the trash", description: "", time: 5, difficulty: "tier1", specialty: "frequent", frequency: 1 },
        { name: "Trim the lawn", description: "", time: 30, difficulty: "tier3", specialty: "frequent", frequency: 0.3 },
        { name: "Unload the dishwasher", description: "", time: 10, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Vaccum the Couch", description: "", time: 10, difficulty: "tier1", specialty: "frequent", frequency: 0.5 },
        { name: "Wash bedding", description: "", time: 5, difficulty: "tier1", specialty: "frequent", frequency: 0.5 },
        { name: "Water the flowers", description: "", time: 5, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Water the trees", description: "", time: 10, difficulty: "tier1", specialty: "constant", frequency: 7 },
        { name: "Weed the garden", description: "", time: 20, difficulty: "tier2", specialty: "frequent", frequency: 2 },
        { name: "Wet Vacuum the couch", description: "", time: 45, difficulty: "tier3", specialty: "rare", frequency: 0.125 }
    ];

    localStorage.setItem("tasks", JSON.stringify(initialTasks));
    loadTasks();
    updateDropdowns();
}

function deleteAllTasks() {
    localStorage.removeItem('tasks');
    loadTasks();
    updateDropdowns();
}

function resetLocalStorage() {
    localStorage.clear();
    location.reload();
}

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(tab => {
        tab.style.display = "none";
    });

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.className = button.className.replace(" active", "");
    });

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

function openSubTab(event, subTabName) {
    const subTabContents = document.querySelectorAll(".sub-tab-content");
    subTabContents.forEach(tab => {
        tab.style.display = "none";
    });

    const subTabButtons = document.querySelectorAll(".sub-tab-button");
    subTabButtons.forEach(button => {
        button.className = button.className.replace(" sub-tab-active", "");
    });

    document.getElementById(subTabName).style.display = "block";
    event.currentTarget.className += " sub-tab-active";
}

function addTask() {
    const taskName = document.getElementById("task-name").value;
    const taskDescription = document.getElementById("task-description").value;
    const taskTime = parseInt(document.getElementById("task-time").value);
    const difficultyModifier = document.getElementById("difficulty-modifier").value;
    const specialtyModifier = document.getElementById("specialty-modifier").value;
    const taskFrequency = parseInt(document.getElementById("task-frequency").value);

    const task = {
        name: taskName,
        description: taskDescription,
        time: taskTime,
        difficulty: difficultyModifier,
        specialty: specialtyModifier,
        frequency: taskFrequency,
    };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    loadTasks();
    updateDropdowns();
}

function loadTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Sort tasks alphabetically by name
    tasks.sort((a, b) => a.name.localeCompare(b.name));

    tasks.forEach((task, index) => {
        const taskPointValue = calculatePointValue(task);
        const taskItem = document.createElement("li");
        taskItem.textContent = `${task.name}: ${taskPointValue} points`;

        const dropdown = document.createElement("div");
        dropdown.className = "dropdown";
        dropdown.innerHTML = `
            <button class="dropdown-button">...</button>
            <div class="dropdown-content">
                <button onclick="openModal(${index})">Edit</button>
                <button onclick="deleteTask(null, ${index})">Delete</button>
            </div>
        `;

        taskItem.appendChild(dropdown);
        taskList.appendChild(taskItem);
    });
}

function updateDropdowns() {
    const person1Dropdown = document.getElementById("person1-task-dropdown");
    const person2Dropdown = document.getElementById("person2-task-dropdown");

    person1Dropdown.innerHTML = '<option value="" disabled selected>Generic Tasks</option>';
    person2Dropdown.innerHTML = '<option value="" disabled selected>Generic Tasks</option>';

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Sort tasks alphabetically by name
    tasks.sort((a, b) => a.name.localeCompare(b.name));

    tasks.forEach((task, index) => {
        const option1 = document.createElement("option");
        option1.value = index;
        option1.textContent = task.name;
        person1Dropdown.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = index;
        option2.textContent = task.name;
        person2Dropdown.appendChild(option2);
    });
}

function calculatePointValue(task) {
    const modifiers = JSON.parse(localStorage.getItem("modifiers")) || {
        tier1: 1,
        tier2: 1.5,
        tier3: 2,
        constant: 1,
        frequent: 1.5,
        moderate: 2,
        rare: 2.5
    };
    return task.time * (1 + modifiers[task.difficulty] + modifiers[task.specialty]);
}

function addPersonTask(personId, taskIndex = null, taskCount = null) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    const taskCountInput = document.getElementById(`${personId}-task-count`);
    taskCount = taskCount || parseInt(taskCountInput.value);
    taskIndex = taskIndex !== null ? taskIndex : dropdown.value;
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const task = tasks[taskIndex];
    const points = calculatePointValue(task) * taskCount;

    let personTasks = JSON.parse(localStorage.getItem(`${personId}-tasks`)) || [];
    personTasks.push({ taskIndex, taskCount, points, date: new Date() });
    localStorage.setItem(`${personId}-tasks`, JSON.stringify(personTasks));

    updatePersonTaskList(personId);

    // Reset the task count input to 1
    taskCountInput.value = 1;
}

function addCustomTask(containerId) {
    const taskName = document.getElementById(`${containerId}-task-name`).value;
    const taskDescription = document.getElementById(`${containerId}-task-description`).value;
    const taskTime = parseInt(document.getElementById(`${containerId}-task-time`).value);
    const difficultyModifier = document.getElementById(`${containerId}-difficulty-modifier`).value;
    const specialtyModifier = document.getElementById(`${containerId}-specialty-modifier`).value;
    const taskFrequency = parseInt(document.getElementById(`${containerId}-task-frequency`).value);

    const task = {
        name: taskName,
        description: taskDescription,
        time: taskTime,
        difficulty: difficultyModifier,
        specialty: specialtyModifier,
        frequency: taskFrequency,
    };

    if (containerId === 'task-bank') {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.push(task);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        loadTasks();
    } else {
        let personTasks = JSON.parse(localStorage.getItem(`${containerId}-tasks`)) || [];
        personTasks.push({ task, points: calculatePointValue(task), date: new Date(), taskCount: 1 });
        localStorage.setItem(`${containerId}-tasks`, JSON.stringify(personTasks));
        updatePersonTaskList(containerId);
    }
}

function updatePersonTaskList(personId) {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let personTasks = JSON.parse(localStorage.getItem(`${personId}-tasks`)) || [];

    const totalPointsElement = document.getElementById(`${personId}-total-points`);
    const todayPointsElement = document.getElementById(`${personId}-today-points`);

    const totalPoints = personTasks.reduce((sum, t) => sum + t.points, 0);
    const todayPoints = personTasks.filter(t => isToday(t.date)).reduce((sum, t) => sum + t.points, 0);

    totalPointsElement.textContent = totalPoints;
    todayPointsElement.textContent = todayPoints;

    const taskList = document.getElementById(`${personId}-task-list`);
    taskList.innerHTML = "";
    personTasks.forEach((t, index) => {
        const task = t.taskIndex !== null ? tasks[t.taskIndex] : t.task;
        const taskItem = document.createElement("li");
        taskItem.textContent = `${task.name} - ${t.taskCount} instance(s) - ${t.points} points`;

        const dropdown = document.createElement("div");
        dropdown.className = "dropdown";
        dropdown.innerHTML = `
            <button class="dropdown-button">...</button>
            <div class="dropdown-content">
                <button onclick="openModal(${t.taskIndex})">Edit</button>
                <button onclick="deleteTask('${personId}', ${index})">Delete</button>
            </div>
        `;

        taskItem.appendChild(dropdown);
        taskList.appendChild(taskItem);
    });
}

function isToday(date) {
    const today = new Date();
    date = new Date(date);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function openModal(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const task = tasks[index];

    document.getElementById("edit-task-index").value = index;
    document.getElementById("edit-task-name").value = task.name;
    document.getElementById("edit-task-description").value = task.description;
    document.getElementById("edit-task-time").value = task.time;
    document.getElementById("edit-difficulty-modifier").value = task.difficulty;
    document.getElementById("edit-specialty-modifier").value = task.specialty;
    document.getElementById("edit-task-frequency").value = task.frequency;

    document.getElementById("edit-modal").style.display = "block";
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}

function updateTask() {
    const taskIndex = document.getElementById("edit-task-index").value;
    const taskName = document.getElementById("edit-task-name").value;
    const taskDescription = document.getElementById("edit-task-description").value;
    const taskTime = parseInt(document.getElementById("edit-task-time").value);
    const difficultyModifier = document.getElementById("edit-difficulty-modifier").value;
    const specialtyModifier = document.getElementById("edit-specialty-modifier").value;
    const taskFrequency = parseInt(document.getElementById("edit-task-frequency").value);

    const task = {
        name: taskName,
        description: taskDescription,
        time: taskTime,
        difficulty: difficultyModifier,
        specialty: specialtyModifier,
        frequency: taskFrequency,
    };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks[taskIndex] = task;
    localStorage.setItem("tasks", JSON.stringify(tasks));

    closeModal();
    loadTasks();
    updateDropdowns();
}

function deleteTask(personId, taskIndex) {
    if (personId) {
        // Delete task from person's task list
        let personTasks = JSON.parse(localStorage.getItem(`${personId}-tasks`)) || [];
        personTasks.splice(taskIndex, 1);
        localStorage.setItem(`${personId}-tasks`, JSON.stringify(personTasks));
        updatePersonTaskList(personId);
    } else {
        // Delete task from task bank
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.splice(taskIndex, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        loadTasks();
        updateDropdowns();
    }
}

function createCustomTaskForm(containerId) {
    const formContainer = document.getElementById(`${containerId}-form-container`);
    formContainer.innerHTML = `
        <h3>Add Custom Task</h3>
        <form id="${containerId}-custom-task-form">
            <input type="text" id="${containerId}-task-name" placeholder="Task Name" required>
            <textarea id="${containerId}-task-description" placeholder="Task Description" required></textarea>
            <input type="number" id="${containerId}-task-time" placeholder="Projected Time (minutes)" required>
            <select id="${containerId}-difficulty-modifier" required>
                <option value="tier1">Tier 1</option>
                <option value="tier2">Tier 2</option>
                <option value="tier3">Tier 3</option>
            </select>
            <select id="${containerId}-specialty-modifier" required>
                <option value="constant">Constant (Daily+)</option>
                <option value="frequent">Frequent (Daily to Weekly)</option>
                <option value="moderate">Moderate (Weekly to Monthly)</option>
                <option value="rare">Rare (Monthly+)</option>
            </select>
            <input type="number" id="${containerId}-task-frequency" placeholder="Times per Week (recurring tasks only)" required>
            <button type="button" onclick="addCustomTask('${containerId}')">Add Custom Task</button>
        </form>
    `;
}

function toggleVisibility(id) {
    const element = document.getElementById(id);
    element.style.display = (element.style.display === "none") ? "block" : "none";
}

function loadModifiers() {
    const modifiers = JSON.parse(localStorage.getItem("modifiers")) || {
        tier1: 1,
        tier2: 1.5,
        tier3: 2,
        constant: 1,
        frequent: 1.5,
        moderate: 2,
        rare: 2.5
    };

    document.getElementById("tier1").value = modifiers.tier1;
    document.getElementById("tier2").value = modifiers.tier2;
    document.getElementById("tier3").value = modifiers.tier3;
    document.getElementById("constant").value = modifiers.constant;
    document.getElementById("frequent").value = modifiers.frequent;
    document.getElementById("moderate").value = modifiers.moderate;
    document.getElementById("rare").value = modifiers.rare;
}

function updateModifiers(type) {
    const modifiers = JSON.parse(localStorage.getItem("modifiers")) || {};

    if (type === 'difficulty') {
        modifiers.tier1 = parseFloat(document.getElementById("tier1").value);
        modifiers.tier2 = parseFloat(document.getElementById("tier2").value);
        modifiers.tier3 = parseFloat(document.getElementById("tier3").value);
    } else if (type === 'frequency') {
        modifiers.constant = parseFloat(document.getElementById("constant").value);
        modifiers.frequent = parseFloat(document.getElementById("frequent").value);
        modifiers.moderate = parseFloat(document.getElementById("moderate").value);
        modifiers.rare = parseFloat(document.getElementById("rare").value);
    }

    localStorage.setItem("modifiers", JSON.stringify(modifiers));
    alert("Modifiers updated successfully!");
}
