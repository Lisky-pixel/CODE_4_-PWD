async function populateWatchVideoPage() {
    if (window.location.pathname.includes('watch-video.html')) {
        document.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('courseId');
            const videoId = urlParams.get('videoId');

            if (courseId && videoId) {
                const course = await fetchData(`http://localhost:3000/courses/${courseId}`);
                console.log(course);
                if (course) {
                    const videoPlayer = document.getElementById('video');
                    const videoTitleElement = document.querySelector('.watch-video .title');
                    const tutorImageElement = document.getElementById('tutor-image');
                    const tutorNameElement = document.getElementById('tutor-name');

                    videoPlayer.src = `images/${videoId}.mp4`;
                    videoPlayer.poster = course.thumbnail;

                    const videoPartNumber = videoId.split('-')[1];
                    videoTitleElement.textContent = `${course.title} (part ${parseInt(videoPartNumber) + 1})`;

                    tutorImageElement.src = course.tutorImage;
                    tutorImageElement.alt = course.tutor;
                    tutorNameElement.textContent = course.tutor;

                    // Fetch and display comments for the current video
                    await fetchAndDisplayComments(videoId);

                } else {
                    console.error('Could not find course with ID:', courseId);
                }
            } else {
                console.error('Missing courseId or videoId in the URL.');
            }
        });
    }
}

populateWatchVideoPage();

async function fetchAndDisplayComments(videoId) {
    try {
        const response = await fetch('http://localhost:3000/comments');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allComments = await response.json();
        const videoComments = allComments.filter(comment => comment.videoId === videoId);
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = ''; // Clear previous comments

        const currentUser = localStorage.getItem('currentUser');
        const loggedInUserId = currentUser ? JSON.parse(currentUser).id : null;

        for (const comment of videoComments) {
            // Fetch user data for the comment author
            const userResponse = await fetch(`http://localhost:3000/users/${comment.userId}`);
            const user = await userResponse.json();

            const commentDiv = document.createElement('div');
            commentDiv.classList.add('box');

            let buttonsHTML = '';
            if (loggedInUserId === comment.userId) {
                buttonsHTML = `
                    <div class="comment-actions">
                        <button class="edit-comment-btn" data-comment-id="${comment.id}">Edit</button>
                        <button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>
                    </div>
                `;
            }

            commentDiv.innerHTML = `
                <div class="user">
                    <img src="${user.profileImage || 'images/pic-5.jpg'}" alt="${user.firstName} ${user.lastName}">
                    <div>
                        <h3>${user.firstName} ${user.lastName}</h3>
                        <span>${new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="comment-box">${comment.text}</div>
                ${buttonsHTML}
            `;
            commentsContainer.appendChild(commentDiv);
        }

        // After displaying comments, set up event listeners for the new buttons
        setupCommentEditAndDelete();

    } catch (error) {
        console.error('Error fetching and displaying comments:', error);
        // Optionally display an error message to the user
    }
}

function setupCommentEditAndDelete() {
    const commentsContainer = document.getElementById('comments-container');

    commentsContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-comment-btn')) {
            const commentId = event.target.dataset.commentId;
            if (confirm('Are you sure you want to delete this comment?')) {
                try {
                    await deleteData('http://localhost:3000/comments', commentId);
                    const urlParams = new URLSearchParams(window.location.search);
                    const videoId = urlParams.get('videoId');
                    await fetchAndDisplayComments(videoId); // Refresh comments
                } catch (error) {
                    console.error('Error deleting comment:', error);
                    alert('Failed to delete comment.');
                }
            }
        } else if (event.target.classList.contains('edit-comment-btn')) {
            const commentId = event.target.dataset.commentId;
            const commentBox = event.target.closest('.box').querySelector('.comment-box');
            const currentText = commentBox.textContent.trim();

            commentBox.innerHTML = `
                <textarea class="edit-textarea"></textarea>
                <div class="edit-actions">
                    <button class="save-edit-btn" data-comment-id="${commentId}">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            `;
            commentBox.querySelector('.edit-textarea').value = currentText; // Set the value directly
        } else if (event.target.classList.contains('save-edit-btn')) {
            const commentId = event.target.dataset.commentId;
            const commentBox = event.target.closest('.box').querySelector('.comment-box');
            const editedText = commentBox.querySelector('.edit-textarea').value.trim();

            if (editedText) {
                try {
                    await updateData(`http://localhost:3000/comments`, commentId, { text: editedText });
                    const urlParams = new URLSearchParams(window.location.search);
                    const videoId = urlParams.get('videoId');
                    await fetchAndDisplayComments(videoId); // Refresh comments
                } catch (error) {
                    console.error('Error updating comment:', error);
                    alert('Failed to update comment.');
                }
            }
        } else if (event.target.classList.contains('cancel-edit-btn')) {
            const commentBox = event.target.closest('.box').querySelector('.comment-box');
            const commentId = event.target.closest('.box').querySelector('.save-edit-btn').dataset.commentId;
            // Re-fetch and display to revert the edit state
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('videoId');
            await fetchAndDisplayComments(videoId);
        }
    });
}