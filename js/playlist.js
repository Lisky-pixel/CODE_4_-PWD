// Function to populate playlist.html
async function populatePlaylistPage() {
    if (window.location.pathname.includes('playlist.html')) {
        document.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('courseId');

            if (courseId) {
                const course = await fetchData(`http://localhost:3000/courses/${courseId}`);
                if (course) {
                    document.getElementById('playlist-title').textContent = course.title;
                    document.getElementById('playlist-tutor-name').textContent = course.tutor;
                    document.getElementById('playlist-tutor-image').src = course.tutorImage;
                    document.getElementById('playlist-tutor-image').alt = course.tutor;
                    document.getElementById('playlist-thumbnail').src = course.thumbnail;
                    document.getElementById('playlist-thumbnail').alt = course.title;
                    document.getElementById('playlist-video-count').textContent = `${course.videos} videos`;
                    document.getElementById('playlist-date').textContent = course.date;
                    // document.getElementById('playlist-description').textContent = course.description || '';

                    const videosContainer = document.getElementById('playlist-videos-container');
                    videosContainer.innerHTML = ''; // Clear any existing videos

                    // Use the course thumbnail for each video in the playlist
                    for (let i = 0; i < 10; i++) {
                        const videoLink = document.createElement('a');
                        videoLink.classList.add('box');
                        videoLink.href = `watch-video.html?courseId=${courseId}&videoId=vid-${i}`; // Assuming you'll have a watch-video page

                        const playIcon = document.createElement('i');
                        playIcon.classList.add('fas', 'fa-play');
                        videoLink.appendChild(playIcon);

                        const videoThumb = document.createElement('img');
                        videoThumb.src = course.thumbnail; // Use the course thumbnail here
                        videoThumb.alt = `${course.title} Part ${i + 1}`;
                        videoLink.appendChild(videoThumb);

                        const videoTitle = document.createElement('h3');
                        videoTitle.textContent = `${course.title} (part ${i + 1})`;
                        videoLink.appendChild(videoTitle);

                        videosContainer.appendChild(videoLink);
                    }
                } else {
                    console.error('Could not find course with ID:', courseId);
                    // Optionally display an error message on the page
                }
            } else {
                console.error('No courseId found in the URL.');
                // Optionally display an error message on the page
            }
        });
    }
}

populatePlaylistPage();