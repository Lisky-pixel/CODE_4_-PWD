/**
 * enrollment.js
 *
 * This file handles course enrollment functionality and updates the UI
 * based on user actions. It interacts with a mock API (JSON Server).
 */

// Function to fetch data from the mock API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetching data failed:', error);
        return null; // Or handle the error appropriately
    }
}

// Function to update data in the mock API
async function updateData(url, id, data) {
    try {
        const response = await fetch(`${url}/${id}`, {
            method: 'PUT', // Or PATCH, depending on your needs
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error updating data at ${url}/${id}:`, error);
        return null; // Or handle the error appropriately
    }
}

// Function to add data to the mock API (POST request)
async function addData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding data:', error);
        throw error;
    }
}

// Function to delete data from the mock API (DELETE request)
async function deleteData(url, id) {
    try {
        const response = await fetch(`${url}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Or just return true/void if no body
    } catch (error) {
        console.error(`Error deleting data at ${url}/${id}:`, error);
        throw error;
    }
}

// Function to generate the HTML for a course card on the dashboard
function createDashboardCourseCard(course) {
    const card = document.createElement('div');
    card.classList.add('box');

    card.innerHTML = `
        <div class="tutor">
            <img src="${course.tutorImage}" alt="${course.tutor}">
            <div class="info">
                <h3>${course.tutor}</h3>
                <span>${course.date}</span>
            </div>
        </div>
        <div class="thumb">
            <img src="${course.thumbnail}" alt="${course.title}">
            <span>${course.videos} videos</span>
        </div>
        <h3 class="title">${course.title}</h3>
        <div class="course-actions">
            <a href="playlist.html?courseId=${course.id}" class="inline-btn">view playlist</a>
            <button class="enroll-btn" data-course-id="${course.id}">enrol</button>
        </div>
    `;

    return card;
}

// Function to display courses on the dashboard (checks localStorage for enrolled status)
async function displayDashboardCourses(allCourses) {
    const container = document.querySelector('.courses .box-container');
    if (!container || !allCourses) return;

    container.innerHTML = ''; // Clear existing content
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let enrolledCourseIds = currentUser?.enrolledCourses || [];

    allCourses.forEach(course => {
        const card = createDashboardCourseCard(course);
        const enrollButton = card.querySelector('.enroll-btn');
        if (enrollButton) {
            enrollButton.addEventListener('click', handleDashboardEnrollClick);
            if (enrolledCourseIds.includes(parseInt(course.id))) {
                enrollButton.textContent = 'Enrolled';
                enrollButton.disabled = true;
            }
        }
        container.appendChild(card);
    });
}

// Function to handle enrollment clicks on the dashboard (updates localStorage)
async function handleDashboardEnrollClick(event) {
    if (!event.target.classList.contains('enroll-btn')) return;

    const courseId = parseInt(event.target.dataset.courseId);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('Please log in to enroll in courses.');
        return;
    }

    // Fetch the user's data from the API
    const user = await fetchData(`http://localhost:3000/users/${currentUser.id}`);

    if (!user) {
        alert('Failed to retrieve user data.');
        return;
    }

    // Check if the user is already enrolled (based on server data)
    if (user.enrolledCourses.includes(courseId)) {
        alert('You are already enrolled in this course.');
        return;
    }

    // Update the user's enrolled courses on the server
    user.enrolledCourses.push(courseId);
    const updatedUser = await updateData(`http://localhost:3000/users/${user.id}`, user);

    if (updatedUser) {
        alert('Enrollment successful!');
        event.target.textContent = 'Enrolled';
        event.target.disabled = true;

        // Update currentUser in localStorage
        currentUser.enrolledCourses = updatedUser.enrolledCourses;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update the dashboard's active course count
        updateDashboardActiveCourseCount(updatedUser.enrolledCourses.length);
    } else {
        alert('Enrollment failed.');
    }
}

// Function to update the "active courses" count on the dashboard (reads from localStorage)
function updateDashboardActiveCourseCount(count) {
    const countElement = document.querySelector('.progress-overview .progress-metric .likes span');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Function to generate the HTML for an enrolled course card
function createEnrolledCourseCard(course) {
    const card = document.createElement('div');
    card.classList.add('box');

    card.innerHTML = `
        <div class="tutor">
            <img src="${course.tutorImage}" alt="${course.tutor}">
            <div class="info">
                <h3>${course.tutor}</h3>
                <span>${course.date}</span>
            </div>
        </div>
        <div class="thumb">
            <img src="${course.thumbnail}" alt="${course.title}">
            <span>${course.videos} videos</span>
        </div>
        <h3 class="title">${course.title}</h3>
        <div class="course-actions">
            <a href="playlist.html?courseId=${course.id}" class="inline-btn">view playlist</a>
            <button class="unenroll-btn" data-course-id="${course.id}">unenroll</button>
        </div>
    `;

    return card;
}

async function handleDeenrollClick(event) {
    if (!event.target.classList.contains('deenroll-btn')) return;

    const courseId = parseInt(event.target.dataset.courseId);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('Please log in.');
        return;
    }

    const userId = currentUser.id;

    // Fetch the user's data from the API
    const user = await fetchData(`http://localhost:3000/users/${userId}`);

    if (!user || !user.enrolledCourses) {
        alert('Failed to retrieve user enrollment data.');
        return;
    }

    const index = user.enrolledCourses.indexOf(courseId);
    if (index === -1) {
        alert('You are not enrolled in this course.');
        return;
    }

    user.enrolledCourses.splice(index, 1);

    const updatedUser = await updateData(`http://localhost:3000/users/${userId}`, user);

    if (updatedUser) {
        alert('Successfully de-enrolled from the course.');
        displayEnrolledCourses(); // Re-render enrolled courses

        // Update currentUser in localStorage
        currentUser.enrolledCourses = updatedUser.enrolledCourses;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update the dashboard if it's currently visible
        if (window.location.pathname.includes('dashboard.html')) {
            const enrollButton = document.querySelector(`.courses .box-container .enroll-btn[data-course-id="${courseId}"]`);
            if (enrollButton) {
                enrollButton.textContent = 'enroll now';
                enrollButton.disabled = false;
            }
            updateDashboardActiveCourseCount(updatedUser.enrolledCourses.length);
        }
    } else {
        alert('Failed to de-enroll from the course.');
    }
}

// Function to display enrolled courses on the courses.html page (fetches from API)
async function displayEnrolledCourses() {
    if (!window.location.pathname.includes('courses.html')) return;
    console.log('displayEnrolledCourses called');

    const container = document.querySelector('.courses .box-container');
    if (!container) {
        console.log('Container not found on courses.html');
        return;
    }
    container.innerHTML = '';

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('currentUser:', currentUser);
    if (!currentUser) {
        console.log('currentUser not found in localStorage on courses.html');
        container.innerHTML = '<p>Please log in to see your enrolled courses.</p>';
        return;
    }

    console.log('Fetching user data...');
    const user = await fetchData(`http://localhost:3000/users/${currentUser.id}`);
    console.log('User data:', user);
    if (!user || !user.enrolledCourses) {
        console.log('User data or enrolledCourses missing:', user);
        container.innerHTML = '<p>Error loading enrolled courses.</p>';
        return;
    }
    console.log('User enrolled courses:', user.enrolledCourses);

    console.log('Fetching all courses...');
    const allCourses = await fetchData('http://localhost:3000/courses');
    console.log('All courses:', allCourses);
    if (!allCourses) {
        console.log('Failed to fetch all courses.');
        container.innerHTML = '<p>Error loading courses.</p>';
        return;
    }

    console.log('All courses data:');
    allCourses.forEach(course => console.log(`  Course ID: ${course.id}, Title: ${course.title}`));

    const enrolledCoursesData = allCourses.filter(course =>
        user.enrolledCourses.includes(parseInt(course.id))
    );
    console.log('Enrolled courses data:', enrolledCoursesData);

    if (enrolledCoursesData.length > 0) {
        enrolledCoursesData.forEach(course => {
            console.log('Creating card for enrolled course:', course);
            const card = createEnrolledCourseCard(course);
            container.appendChild(card);

            // Add event listener for the deenroll button
            const deenrollButton = card.querySelector('.unenroll-btn');
            if (deenrollButton) {
                deenrollButton.addEventListener('click', handleDeenrollClick);
            }
        });
    } else {
        container.innerHTML = '<p>No courses enrolled yet.</p>';
    }
}

// --- Initialization ---

// Fetch and display courses on dashboard.html
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const allCourses = await fetchData('http://localhost:3000/courses');
        if (allCourses) {
            displayDashboardCourses(allCourses);

            // Update active course count on dashboard load from localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.enrolledCourses) {
                updateDashboardActiveCourseCount(currentUser.enrolledCourses.length);
            }
        }

        // Clear hardcoded progress on dashboard
        const currentCoursesDiv = document.querySelector('.home-grid .box:first-child .current-courses');
        const completedCoursesDiv = document.querySelector('.home-grid .box:first-child .completed-courses');
        if (currentCoursesDiv) currentCoursesDiv.innerHTML = '<h3>in progress</h3>';
        if (completedCoursesDiv) completedCoursesDiv.innerHTML = '<h4>completed</h4><ul class="course-list"></ul>';
    });
}

// Display enrolled courses on courses.html
if (window.location.pathname.includes('courses.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        displayEnrolledCourses();
    });
}