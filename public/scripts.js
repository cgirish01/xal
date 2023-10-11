function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    fetch('/api/users/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            email,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Signup failed: ' + data.error);
        } else {
            alert('Signup successful! Please login.');
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Login failed: ' + data.error);
        } else {
            alert('Login successful! Welcome, ' + data.name);
            window.location.href = "/dashboard.html";
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}

function showSignup() {
    hideAllForms();
    document.getElementById('signup-section').style.display = 'block';
}

function showLogin() {
    hideAllForms();
    document.getElementById('login-section').style.display = 'block';
}

function hideAllForms() {
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
}



function populateUserDropdowns() {
    fetch('/api/processes/users')
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);  // Debug point
        if (Array.isArray(data)) {
            const dropdowns = ['user1', 'user2', 'user3', 'user4', 'user5'];
            dropdowns.forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                data.forEach(user => {
                    const option = new Option(user.name, user.id);
                    dropdown.add(option);
                });
            });
        } else {
            console.error("Received data is not an array:", data);
        }
    })
    .catch(error => {
        console.error("Error in populateUserDropdowns:", error);
    });
}

populateUserDropdowns();

function createNewProcess() {
    const users = [
        document.getElementById('user1').value,
        document.getElementById('user2').value,
        document.getElementById('user3').value,
        document.getElementById('user4').value,
        document.getElementById('user5').value
    ];

    const uniqueUsers = [...new Set(users)];
    if (uniqueUsers.length !== users.length) {
        alert("Please select distinct users.");
        return;
    }
    console.log(users);  // Debug point

    const description = document.getElementById('process-description').value;
    console.log(description);  // Debug point
    
    fetch('/api/processes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            users,
            description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Failed to create process: ' + data.error);
        } else {
            alert('Process created successfully!');
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}

// Call this function when the dashboard page loads to populate the dropdowns:


function loadProcesses() {
    fetch('/api/processes')
    .then(response => response.json())
    .then(data => {
        const processList = document.getElementById('process-list');
        data.forEach(process => {
            const li = document.createElement('li');
            li.textContent = process.description;
            processList.appendChild(li);
        });
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}
