document.addEventListener("DOMContentLoaded", () => {
    authenticate().then(loadClient).then(syncTasksFromSheets);
    updateDropdowns();
    createCustomTaskForm('task-bank');
    createCustomTaskForm('person1');
    createCustomTaskForm('person2');
    loadModifiers();
});

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

    addTaskToSheet('task-bank', task);
}

function addPersonTask(personId) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    const taskIndex = dropdown.value;
    const taskCount = parseInt(document.getElementById(`${personId}-task-count`).value);

    const task = {
        taskIndex,
        taskCount,
        date: new Date()
    };

    addTaskToSheet(personId, task);
}

function addTaskToSheet(sheetName, task) {
    loadTasksFromSheet(sheetName).then(tasks => {
        tasks.push(task);
        saveTasksToSheet(sheetName, tasks);
    });
}

function updateTask() {
    const taskIndex = document.getElementById("edit-task-index").value;
    const taskName = document.getElementById("edit-task-name").value;
    const taskDescription = document.getElementById("edit-task-description").value;
    const taskTime = parseInt(document.getElementById("edit-task-time").value);
    const difficultyModifier = document.getElementById("edit-difficulty-modifier").value;
    const specialtyModifier = document.getElementById("edit-specialty-modifier").value;
    const taskFrequency = parseInt(document.getElementById("edit-task-frequency").value);

    const updatedTask = {
        name: taskName,
        description: taskDescription,
        time: taskTime,
        difficulty: difficultyModifier,
        specialty: specialtyModifier,
        frequency: taskFrequency,
    };

    loadTasksFromSheet('task-bank').then(tasks => {
        tasks[taskIndex] = updatedTask;
        saveTasksToSheet('task-bank', tasks);
        closeModal();
    });
}

function deleteTask(sheetName, taskIndex) {
    loadTasksFromSheet(sheetName).then(tasks => {
        tasks.splice(taskIndex, 1);
        saveTasksToSheet(sheetName, tasks);
    });
}

function loadTasksFromSheet(sheetName) {
    return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1oEUISyQQF1F29Bg8SlIAu7g_cNuewPhC3v4SimU2CfU',
        range: `${sheetName}!A1:F100`
    }).then(response => {
        const tasks = response.result.values || [];
        return tasks.map(row => ({
            name: row[0],
            description: row[1],
            time: parseInt(row[2]),
            difficulty: row[3],
            specialty: row[4],
            frequency: parseFloat(row[5])
        }));
    }, error => {
        console.error('Error loading tasks from sheet', error);
        return [];
    });
}

function saveTasksToSheet(sheetName, tasks) {
    const values = tasks.map(task => [
        task.name, task.description, task.time, task.difficulty, task.specialty, task.frequency
    ]);

    return gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: '1oEUISyQQF1F29Bg8SlIAu7g_cNuewPhC3v4SimU2CfU',
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: values }
    }).then(response => {
        console.log('Tasks saved to sheet', response);
    }, error => {
        console.error('Error saving tasks to sheet', error);
    });
}

function syncTasksFromSheets() {
    Promise.all([
        loadTasksFromSheet('task-bank').then(tasks => {
            // Update task bank UI
            updateTaskBank(tasks);
        }),
        loadTasksFromSheet('person1').then(tasks => {
            // Update person 1's task list UI
            updatePersonTaskList('person1', tasks);
        }),
        loadTasksFromSheet('person2').then(tasks => {
            // Update person 2's task list UI
            updatePersonTaskList('person2', tasks);
        })
    ]).then(() => {
        console.log('Tasks synced from sheets');
    });
}

function updateTaskBank(tasks) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

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
                <button onclick="deleteTask('task-bank', ${index})">Delete</button>
            </div>
        `;

        taskItem.appendChild(dropdown);
        taskList.appendChild(taskItem);
    });
}

function updatePersonTaskList(personId, tasks) {
    const taskList = document.getElementById(`${personId}-task-list`);
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const taskItem = document.createElement("li");
        taskItem.textContent = `${task.name} - ${task.taskCount} instance(s)`;

        const dropdown = document.createElement("div");
        dropdown.className = "dropdown";
        dropdown.innerHTML = `
            <button class="dropdown-button">...</button>
            <div class="dropdown-content">
                <button onclick="deleteTask('${personId}', ${index})">Delete</button>
            </div>
        `;

        taskItem.appendChild(dropdown);
        taskList.appendChild(taskItem);
    });
}

function calculatePointValue(task) {
    const modifiers = JSON.parse(localStorage.getItem("modifiers")) || {
        tier1: 0,
        tier2: 0.5,
        tier3: 0.75,
        constant: 0,
        frequent: 0.25,
        moderate: 0.5,
        rare: 0.75
    };
    return task.time * (1 + modifiers[task.difficulty] + modifiers[task.specialty]);
}

function openModal(index) {
    loadTasksFromSheet('task-bank').then(tasks => {
        const task = tasks[index];
        document.getElementById("edit-task-index").value = index;
        document.getElementById("edit-task-name").value = task.name;
        document.getElementById("edit-task-description").value = task.description;
        document.getElementById("edit-task-time").value = task.time;
        document.getElementById("edit-difficulty-modifier").value = task.difficulty;
        document.getElementById("edit-specialty-modifier").value = task.specialty;
        document.getElementById("edit-task-frequency").value = task.frequency;
        document.getElementById("edit-modal").style.display = "block";
    });
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}

function toggleVisibility(id) {
    const element = document.getElementById(id);
    element.style.display = (element.style.display === "none") ? "block" : "none";
}

function loadModifiers() {
    const modifiers = JSON.parse(localStorage.getItem("modifiers")) || {
        tier1: 0,
        tier2: 0.5,
        tier3: 1,
        constant: 0,
        frequent: 0.25,
        moderate: 0.5,
        rare: 0.75
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
