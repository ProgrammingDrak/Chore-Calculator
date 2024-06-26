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
    console.log("DOM fully loaded and parsed");
    loadTaskBank();
    loadModifiers();
    updateDropdowns('person1');
    updateDropdowns('person2');
});

function openTab(event, tabName) {
    console.log(`Opening tab: ${tabName}`);
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(tab => tab.style.display = "none");
    document.getElementById(tabName).style.display = "block";

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));
    event.currentTarget.classList.add("active");
}

function addTaskToBank() {
    const task = {
        name: document.getElementById("task-name").value,
        time: parseInt(document.getElementById("task-time").value),
        difficulty: parseFloat(document.getElementById("difficulty-modifier").value),
        rarity: parseFloat(document.getElementById("rarity-modifier").value),
        frequency: parseInt(document.getElementById("task-frequency").value),
    };
    db.collection("taskBank").add(task).then(() => {
        console.log("Task added to task bank successfully");
        loadTaskBank();
    }).catch(error => {
        console.error("Error adding task to task bank: ", error);
    });
}

function initializeTaskBank() {
    const initialTasks = [
        { name: "After dinner clean up", description: "", time: 20, difficulty: 0, rarity: 0, frequency: 7 },
        { name: "Clean the half bathroom", description: "", time: 20, difficulty: 1, rarity: 1, frequency: 0.25 },
        // Add other initial tasks here...
    ];

    initialTasks.forEach(task => {
        db.collection("taskBank").add(task).then(() => {
            console.log(`Initialized task in task bank: ${task.name}`);
            loadTaskBank();
        }).catch(error => {
            console.error(`Error initializing task in task bank: ${task.name}`, error);
        });
    });
}

function loadTaskBank() {
    const taskList = document.getElementById("task-bank-list");
    taskList.innerHTML = "";

    db.collection("taskBank").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const task = doc.data();
            const taskItem = document.createElement("li");
            taskItem.textContent = `${task.name} - ${calculatePoints(task)} points`;
            taskList.appendChild(taskItem);
        });
        console.log("Task bank loaded successfully");
    }).catch(error => {
        console.error("Error loading task bank: ", error);
    });
}

function updateDropdowns(personId) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    dropdown.innerHTML = '<option value="" disabled selected>Select Task</option>';

    db.collection("taskBank").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const task = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = task.name;
            dropdown.appendChild(option);
        });
        console.log(`Dropdowns updated for ${personId}`);
    }).catch(error => {
        console.error("Error updating dropdowns: ", error);
    });
}

function addPersonTask(personId) {
    const dropdown = document.getElementById(`${personId}-task-dropdown`);
    const taskId = dropdown.value;
    const taskCount = parseInt(document.getElementById(`${personId}-task-count`).value);

    db.collection("taskBank").doc(taskId).get().then(doc => {
        const task = doc.data();
        const points = calculatePoints(task) * taskCount;

        db.collection(`users/${personId}/tasks`).add({
            taskId,
            taskCount,
            points,
            date: new Date()
        }).then(() => {
            console.log(`Task added to ${personId}`);
            updatePersonTaskList(personId);
        }).catch(error => {
            console.error(`Error adding task to ${personId}: `, error);
        });
    }).catch(error => {
        console.error("Error getting task from task bank: ", error);
    });
}

function updatePersonTaskList(personId) {
    const taskList = document.getElementById(`${personId}-task-list`);
    taskList.innerHTML = "";
    let totalPoints = 0;

    db.collection(`users/${personId}/tasks`).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const personTask = doc.data();
            totalPoints += personTask.points;

            db.collection("taskBank").doc(personTask.taskId).get().then(taskDoc => {
                const task = taskDoc.data();
                const taskItem = document.createElement("li");
                taskItem.textContent = `${task.name} - ${personTask.taskCount} instances - ${personTask.points} points`;
                taskList.appendChild(taskItem);
            }).catch(error => {
                console.error("Error fetching task from task bank: ", error);
            });
        });
        document.getElementById(`${personId}-total-points`).textContent = totalPoints;
    }).catch(error => {
        console.error(`Error updating task list for ${personId}: `, error);
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
    }).catch(error => {
        console.error("Error loading modifiers: ", error);
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
    db.collection("modifiers").doc("default").set(modifiers).then(() => {
        console.log("Modifiers updated successfully.");
    }).catch(error => {
        console.error("Error updating modifiers: ", error);
    });
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
