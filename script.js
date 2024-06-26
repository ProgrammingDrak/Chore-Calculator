// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7q5_HlroXl_B5c8VpuTwnn0bhvX2rRfM",
  authDomain: "gamify-your-life-427518.firebaseapp.com",
  projectId: "gamify-your-life-427518",
  storageBucket: "gamify-your-life-427518.appspot.com",
  messagingSenderId: "158741644546",
  appId: "1:158741644546:web:3e6aa5c3be76d1e8d5ee1b",
  measurementId: "G-LK3ZM72T2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    updateDropdowns();
    updatePersonTaskList('person1');
    updatePersonTaskList('person2');
    createCustomTaskForm('task-bank');
    createCustomTaskForm('person1');
    createCustomTaskForm('person2');
    loadModifiers();
    setupTabSwitching();
});

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const subTabButtons = document.querySelectorAll('.sub-tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            openTab(event, button.textContent.trim());
        });
    });

    subTabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            openSubTab(event, button.textContent.trim().toLowerCase().replace(' ', '-'));
        });
    });
}

function deleteAllTasks() {
    db.collection("tasks").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
        loadTasks();
        updateDropdowns();
    });
}

function resetLocalStorage() {
    db.collection("tasks").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
        location.reload();
    });
}

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

    initialTasks.forEach(task => {
        db.collection("tasks").add(task);
    });
    loadTasks();
}

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(tab => {
        tab.style.display = "none";
    });

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.classList.add("active");
}

function openSubTab(event, subTabName) {
    const subTabContents = document.querySelectorAll(".sub-tab-content");
    subTabContents.forEach(tab => {
        tab.style.display = "none";
    });

    const subTabButtons = document.querySelectorAll(".sub-tab-button");
    subTabButtons.forEach(button => {
        button.classList.remove("sub-tab-active");
    });

    document.getElementById(subTabName).style.display = "block";
    event.currentTarget.classList.add("sub-tab-active");
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

    db.collection("tasks").add(task);
    loadTasks();
    updateDropdowns();
}

function loadTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    db.collection("tasks").get().then((querySnapshot) => {
        let tasks = [];
        querySnapshot.forEach((doc) => {
            let task = doc.data();
            task.id = doc.id;
            tasks.push(task);
        });

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
                    <button onclick="openModal('${task.id}')">Edit</button>
                    <button onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            `;

            taskItem.appendChild(dropdown);
            taskList.appendChild(taskItem);
        });
    });
}

function updateDropdowns() {
    const person1Dropdown = document.getElementById("person1-task-dropdown");
    const person2Dropdown = document.getElementById("person2-task-dropdown");

    person1Dropdown.innerHTML = '<option value="" disabled selected>Generic Tasks</option>';
    person2Dropdown.innerHTML = '<option value="" disabled selected>Generic Tasks</option>';

    db.collection("tasks").get().then((querySnapshot) => {
        let tasks = [];
        querySnapshot.forEach((doc) => {
            let task = doc.data();
            task.id = doc.id;
            tasks.push(task);
        });

        tasks.sort((a, b) => a.name.localeCompare(b.name));

        tasks.forEach((task) => {
            const option1 = document.createElement("option");
            option1.value = task.id;
            option1.textContent = task.name;
            person1Dropdown.appendChild(option1);

            const option2 = document.createElement("option");
            option2.value = task.id;
            option2.textContent = task.name;
            person2Dropdown.appendChild(option2);
        });
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

function addPersonTask(personId, taskId = null, taskCount = null) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    const taskCountInput = document.getElementById(`${personId}-task-count`);
    taskCount = taskCount || parseInt(taskCountInput.value);
    taskId = taskId !== null ? taskId : dropdown.value;

    db.collection("tasks").doc(taskId).get().then((doc) => {
        const task = doc.data();
        const points = calculatePointValue(task) * taskCount;

        db.collection(`${personId}-tasks`).add({
            taskId,
            taskCount,
            points,
            date: new Date()
        });

        updatePersonTaskList(personId);
        taskCountInput.value = 1;
    });
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
        db.collection("tasks").add(task).then(() => {
            loadTasks();
        });
    } else {
        db.collection(`${containerId}-tasks`).add({
            task,
            taskCount: 1,
            points: calculatePointValue(task),
            date: new Date()
        }).then(() => {
            updatePersonTaskList(containerId);
        });
    }
}

function updatePersonTaskList(personId) {
    const tasks = [];
    db.collection("tasks").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let task = doc.data();
            task.id = doc.id;
            tasks.push(task);
        });

        db.collection(`${personId}-tasks`).get().then((querySnapshot) => {
            let personTasks = [];
            querySnapshot.forEach((doc) => {
                let task = doc.data();
                task.id = doc.id;
                personTasks.push(task);
            });

            const totalPointsElement = document.getElementById(`${personId}-total-points`);
            const todayPointsElement = document.getElementById(`${personId}-today-points`);

            const totalPoints = personTasks.reduce((sum, t) => sum + t.points, 0);
            const todayPoints = personTasks.filter(t => isToday(t.date)).reduce((sum, t) => sum + t.points, 0);

            totalPointsElement.textContent = totalPoints;
            todayPointsElement.textContent = todayPoints;

            const taskList = document.getElementById(`${personId}-task-list`);
            taskList.innerHTML = "";
            personTasks.forEach((t, index) => {
                const task = tasks.find(task => task.id === t.taskId) || t.task;
                const taskItem = document.createElement("li");
                taskItem.textContent = `${task.name} - ${t.taskCount} instance(s) - ${t.points} points`;

                const dropdown = document.createElement("div");
                dropdown.className = "dropdown";
                dropdown.innerHTML = `
                    <button class="dropdown-button">...</button>
                    <div class="dropdown-content">
                        <button onclick="openModal('${t.taskId}')">Edit</button>
                        <button onclick="deleteTask('${personId}', '${t.id}')">Delete</button>
                    </div>
                `;

                taskItem.appendChild(dropdown);
                taskList.appendChild(taskItem);
            });
        });
    });
}

function isToday(date) {
    const today = new Date();
    date = new Date(date);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function openModal(id) {
    db.collection("tasks").doc(id).get().then((doc) => {
        const task = doc.data();

        document.getElementById("edit-task-index").value = id;
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

function updateTask() {
    const taskId = document.getElementById("edit-task-index").value;
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

    db.collection("tasks").doc(taskId).update(task).then(() => {
        closeModal();
        loadTasks();
        updateDropdowns();
    });
}

function deleteTask(personId, taskId) {
    if (personId) {
        db.collection(`${personId}-tasks`).doc(taskId).delete().then(() => {
            updatePersonTaskList(personId);
        });
    } else {
        db.collection("tasks").doc(taskId).delete().then(() => {
            loadTasks();
            updateDropdowns();
        });
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
                <option value="moderate">Weekly to Monthly</option>
                <option value="rare">Rare (Monthly+)</option>
            </select>
            <input type="number" id="${containerId}-task-frequency" placeholder="Times per Week" required>
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
