console.log('auth_handler.js is running');

document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (currentUser) {
        updateDashboardSidebar(currentUser);
        updateProfilePage(currentUser);
        updateHeaderProfileDropdown(currentUser); // For the top-right dropdown
    } else {
        // Handle cases where the user is not logged in on these pages
        // For example, you might want to redirect to the sign-in page
        console.log("No user logged in on this page.");
        // window.location.href = 'Signin.html';
    }
});

function updateDashboardSidebar(user) {
    const sidebarNameElements = document.querySelectorAll('.side-bar .profile .name');
    sidebarNameElements.forEach(element => {
        element.textContent = `${user.firstName} ${user.lastName}`;
    });
}

function updateProfilePage(user) {
    const profileNameElements = document.querySelectorAll('.user-profile .info .user h3');
    profileNameElements.forEach(element => {
        element.textContent = `${user.firstName} ${user.lastName}`;
    });

    // Add email to the profile page (you might need to adjust the HTML to have a specific element for this)
    const profileInfoDiv = document.querySelector('.user-profile .info .user');
    if (profileInfoDiv) {
        const emailParagraph = document.createElement('p');
        emailParagraph.textContent = user.email;
        // Insert it after the "student" paragraph (you might need to adjust this based on your exact HTML)
        const studentParagraph = profileInfoDiv.querySelector('p');
        if (studentParagraph) {
            profileInfoDiv.insertBefore(emailParagraph, studentParagraph.nextSibling);
        } else {
            profileInfoDiv.appendChild(emailParagraph); // If no "student" paragraph
        }
    }
}

function updateHeaderProfileDropdown(user) {
    const headerNameElements = document.querySelectorAll('.header .flex .profile .name');
    headerNameElements.forEach(element => {
        element.textContent = `${user.firstName} ${user.lastName}`;
    });
}