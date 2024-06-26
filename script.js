// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC7q5_HlroXl_B5c8VpuTwnn0bhvX2rRfM",
    authDomain: "gamify-your-life-427518.firebaseapp.com",
    projectId: "gamify-your-life-427518",
    storageBucket: "gamify-your-life-427518.appspot.com",
    messagingSenderId: "158741644546",
    appId: "1:158741644546:web:3e6aa5c3be76d1e8d5ee1b",
    measurementId: "G-LK3ZM72T2W"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadModifiers();
    updateDropdowns('person1');
    updateDropdowns('person2');
});

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(tab => tab.style.display = "none");
    document.getElementById(tabName).style.display = "block";

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));
    event.currentTarget.classList.add("active");
}

function addTask() {
    const task = {
        name: document.getElementById("task-name").value,
        time: parseInt(document.getElementById("task-time").value),
        difficulty: parseFloat(document.getElementById("difficulty-modifier").value),
        rarity: parseFloat(document.getElementById("rarity-modifier").value),
        frequency: parseInt(document.getElementById("task-frequency").value),
    };
    db.collection("tasks").add(task).then(() => loadTasks());
}

function initializeTasks() {
    const initialTasks = [
        { name: "After dinner clean up", description: "", time: 20, difficulty: 0, rarity: 0, frequency: 7 },
        { name: "Clean the half bathroom", description: "", time: 20, difficulty: 1, rarity: 1, frequency: 0.25 },
        // Add other initial tasks here...
    ];

    initialTasks.forEach(task => {
        db.collection("tasks").add(task);
    });
    loadTasks();
}

function loadTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    db.collection("tasks").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const task = doc.data();
            const taskItem = document.createElement("li");
            taskItem.textContent = `${task.name} - ${calculatePoints(task)} points`;
            taskList.appendChild(taskItem);
        });
        updateDropdowns('person1');
        updateDropdowns('person2');
    });
}

function updateDropdowns(personId) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    dropdown.innerHTML = '<option value="" disabled selected>Select Task</option>';

    db.collection("tasks").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const task = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = task.name;
            dropdown.appendChild(option);
        });
    });
}

function addPersonTask(personId) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    const taskId = dropdown.value;
    const taskCount = parseInt(document.getElementById(`${personId}-task-count`).value);

    db.collection("tasks").doc(taskId).get().then(doc => {
        const task = doc.data();
        const points = calculatePoints(task) * taskCount;

        db.collection(`${personId}-tasks`).add({
            taskId,
            taskCount,
            points,
            date: new Date()
        }).then(() => updatePersonTaskList(personId));
    });
}

function updatePersonTaskList(personId) {
    const taskList = document.getElementById(`${personId}-task-list`);
    taskList.innerHTML = "";
    let totalPoints = 0;

    db.collection(`${personId}-tasks`).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const personTask = doc.data();
            totalPoints += personTask.points;

            db.collection("tasks").doc(personTask.taskId).get().then(taskDoc => {
                const task = taskDoc.data();
                const taskItem = document.createElement("li");
                taskItem.textContent = `${task.name} - ${personTask.taskCount} instances - ${personTask.points} points`;
                taskList.appendChild(taskItem);
            });
        });
        document.getElementById(`${personId}-total-points`).textContent = totalPoints;
    });
}

function loadModifiers() {
    const modifiers = document.getElementById("modifiers-form");
    db.collection("modifiers").doc("default").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            modifiers.braindead.value = data.braindead;
            modifiers.easy.value = data.easy;
            modifiers.medium.value = data.medium;
            modifiers.hard.value = data.hard;
            modifiers.daily.value = data.daily;
            modifiers["daily-weekly"].value = data["daily-weekly"];
            modifiers["weekly-monthly"].value = data["weekly-monthly"];
            modifiers.monthly.value = data.monthly;
        }
    });
}

function updateModifiers() {
    const modifiers = {
        braindead: parseFloat(document.getElementById("braindead").value),
        easy: parseFloat(document.getElementById("easy").value),
        medium: parseFloat(document.getElementById("medium").value),
        hard: parseFloat(document.getElementById("hard").value),
        daily: parseFloat(document.getElementById("daily").value),
        "daily-weekly": parseFloat(document.getElementById("daily-weekly").value),
        "weekly-monthly": parseFloat(document.getElementById("weekly-monthly").value),
        monthly: parseFloat(document.getElementById("monthly").value),
    };
    db.collection("modifiers").doc("default").set(modifiers);
}

function calculatePoints(task) {
    const modifiers = {
        braindead: 0,
        easy: 0.5,
        medium: 0.75,
        hard: 1,
        daily: 0,
        "daily-weekly": 0.25,
        "weekly-monthly": 0.5,
        monthly: 1
    };
    return task.time * (1 + modifiers[task.difficulty] + modifiers[task.rarity]);
}
