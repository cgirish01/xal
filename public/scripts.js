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

// populateUserDropdowns();

function createNewProcess() {
    // const users = [
    //     document.getElementById('user1').value,
    //     document.getElementById('user2').value,
    //     document.getElementById('user3').value,
    //     document.getElementById('user4').value,
    //     document.getElementById('user5').value
    // ];
    const users = [
        {id: document.getElementById('user1').value, canSeeComments: document.getElementById('user1-canSeeComments').checked},
        {id: document.getElementById('user2').value, canSeeComments: document.getElementById('user2-canSeeComments').checked},
        {id: document.getElementById('user3').value, canSeeComments: document.getElementById('user3-canSeeComments').checked},
        {id: document.getElementById('user4').value, canSeeComments: document.getElementById('user4-canSeeComments').checked},
        {id: document.getElementById('user5').value, canSeeComments: document.getElementById('user5-canSeeComments').checked}
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


async function submitSignOff(processId) {
    console.log("processId")
    // const processId = event.target.parentElement.getAttribute('data-process-id');
    console.log("started process")
    const comment = document.getElementById(`signoff-comment-${processId}`).value.trim();
    const imageFile = document.getElementById(`signoff-image-${processId}`).files[0];

    if (!comment) {
        alert('Please add a comment before submitting.');
        return; // exit the function
    }

    // Check if an image file is provided
    if (!imageFile) {
        alert('Please select an image for upload before submitting.');
        return; // exit the function
    }
    let imagePath = null;

    // First, upload the image and get the path
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const imageResponse = await fetch('api/processes/uploadImage', {
                method: 'POST',
                body: formData
            });

            const imageData = await imageResponse.json();
            if (imageData.error) {
                alert('Image upload failed: ' + imageData.error);
                return;
            }

            imagePath = imageData.path;
        } catch (error) {
            alert('Image upload error: ' + error);
            return;
        }
    }
    console.log("image path", imagePath)
    console.log("process id", processId)
    console.log("comment", comment)
    // Then, proceed with the sign-off process
    fetch('/api/processes/signoff', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            processId,
            comment,
            picturePath: imagePath
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Failed to submit signoff: ' + data.error);
        } else {
            alert('Signoff submitted successfully!');
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}



function loadMyProcesses() {
    fetch('/api/processes/createdByMe')
    .then(response => response.json())
    .then(data => {
        const processList = document.getElementById('created-process-list');
        processList.innerHTML = "";
        console.log("data", data)
        data.forEach(process => {
            displayProcessWithUsers(process, processList);
        });
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}
function displayProcessWithUsers(process, container) {
    const processContainer = document.createElement('div');

    const processTitle = document.createElement('h3');
    processTitle.textContent = process.description;
    processContainer.appendChild(processTitle);
    process.signOffs.forEach(user => {
        const userContainer = document.createElement('div');
        userContainer.classList.add('user-container');

        const userName = document.createElement('span');
        userName.textContent = user.username;
        userContainer.appendChild(userName);

        const userImage = document.createElement('img');
        if (user.picture_path) {
            userImage.src = user.picture_path;
            userImage.width = 30;  // 30 pixels, adjust this as per your requirements.
            userImage.height = 30;
        } else {
            userImage.alt = 'No image uploaded';
        }
        userContainer.appendChild(userImage);

        const userComment = document.createElement('span');
        userComment.textContent = user.comment || "No comment";  // Default to "No comment" if empty.
        userContainer.appendChild(userComment);

        processContainer.appendChild(userContainer);
    });

    container.appendChild(processContainer);
}



function loadSignoffProcesses() {
    fetch('/api/processes/needsSignoff')
    .then(response => response.json())
    .then(data => {
        const processList = document.getElementById('signoff-process-list');
        processList.innerHTML = "";
        data.forEach(process => {
            console.log("process", process.id)
            displayProcessForSignoff(process, processList);
        });
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}



function displayProcessForSignoff(process, container) {
    const processContainer = document.createElement('div');
    processContainer.classList.add('process-item');

    const processName = document.createElement('p');
    processName.textContent = process.description;
    processContainer.appendChild(processName);

    process.users.forEach(user => {
        const userContainer = document.createElement('div');
        userContainer.classList.add('user-item');

        const userName = document.createElement('p');
        userName.textContent = user.name;
        userContainer.appendChild(userName);

        const userImage = document.createElement('img');
        if (user.picture_path) {
            userImage.src = user.picture_path;
        } else {
            userImage.alt = 'No image uploaded';
        }
        userContainer.appendChild(userImage);

        const userComment = document.createElement('p');
        userComment.textContent = user.comment || "No comment";
        userContainer.appendChild(userComment);

        processContainer.appendChild(userContainer);
    });

    const signoffForm = document.createElement('div');
    signoffForm.classList.add('sign-off-form');

    const commentLabel = document.createElement('label');
    commentLabel.textContent = "Comment:";
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = `signoff-comment-${process.id}`;
    signoffForm.appendChild(commentLabel);
    signoffForm.appendChild(commentTextarea);

    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = "Upload Image:";
    const uploadInput = document.createElement('input');
    uploadInput.type = "file";
    uploadInput.id = `signoff-image-${process.id}`;
    signoffForm.appendChild(uploadLabel);
    signoffForm.appendChild(uploadInput);

    const submitButton = document.createElement('button');
    submitButton.textContent = "Submit Sign-off";
    submitButton.onclick = submitSignOff.bind(null, process.id);
    signoffForm.appendChild(submitButton);

    processContainer.appendChild(signoffForm);

    container.appendChild(processContainer);
}

function loadProcessesToBeSignedOffByYou() {
    fetch('/api/processes/signedOffByYou')
    .then(response => response.json())
    .then(data => {
        const processList = document.getElementById('toBeSignedOffByYou-list');
        processList.innerHTML = "";
        data.forEach(process => {
            displayProcessForSignoff(process, processList); // Reuse the same function since the display logic is similar
        });
    })
    .catch(error => {
        alert('Error: ' + error);
    });
}


async function loadNotifications() {
    try {
        const response = await fetch('/api/processes/notifications');
        console.log("Received:", response);

        if (!response.ok) {
            console.error("Failed to fetch notifications:", response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Data:', data);

        displayNotifications(data);
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

function displayNotifications(notifications) {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) {
        console.error("No element with ID 'notifications-list' found.");
        return;
    }

    notificationsList.innerHTML = '';

    notifications.forEach(notification => {
        const item = document.createElement('li');
        item.textContent = notification.message;
        item.onclick = () => markAsRead(notification.id);
        notificationsList.appendChild(item);
    });
}

async function markAsRead(notificationId) {
    try {
        const response = await fetch('/api/processes/notifications/mark-as-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notificationId }),
        });

        if (!response.ok) {
            console.error("Failed to mark notification as read:", response.statusText);
            return;
        }

        // If successful, refresh the notifications
        loadNotifications();
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}


// On page load or using setInterval:
loadNotifications();



populateUserDropdowns();
loadMyProcesses();
loadSignoffProcesses();
loadProcessesToBeSignedOffByYou();
