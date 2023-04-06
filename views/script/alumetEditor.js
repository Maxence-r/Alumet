const postContainers = document.querySelectorAll('.post-scroll');

// loop through all post scroll containers and attach event listeners
postContainers.forEach(postContainer => {
  let isDragging = false;
  let currentPost;

  postContainer.addEventListener('mousedown', function(event) {
    let target = event.target;
    while (target && !target.classList.contains('post')) {
      target = target.parentNode;
    }
    if (target) {
      isDragging = true;
      currentPost = target;
      localStorage.setItem('currentPost', currentPost.dataset.position);
      currentPost.style.zIndex = 1;
    }
  });

  document.addEventListener('mousemove', function(event) {
    if (isDragging) {
      currentPost.style.position = 'absolute';

      currentPost.style.top = event.clientY - currentPost.clientHeight / 2 + 'px';
      currentPost.style.cursor = 'grabbing';
      currentPost.style.transform = 'translateY(0)';
      currentPost.style.boxShadow = '0 0 50px 0 rgba(0, 0, 0, 0.6)';
      currentPost.style.transform = 'scale(1.05)'
        
      
      const scrollThreshold = 50; 
      if (event.clientY < postContainer.getBoundingClientRect().top + scrollThreshold) {
        postContainer.scrollTop -= 10;
      } else if (event.clientY > postContainer.getBoundingClientRect().bottom - scrollThreshold) {
        postContainer.scrollTop += 10;
      }
    }
  });

  document.addEventListener('mouseup', function(event) {
    if (isDragging) {
        isDragging = false;
        currentPost.style.position = 'static';
        currentPost.style.zIndex = 0;
        currentPost.style.cursor = 'grab';
        currentPost.style.boxShadow = 'none';
        currentPost.style.transform = 'scale(1)'

        const posts = Array.from(postContainer.querySelectorAll('.post'));
       
        const targetPost = posts.find(post => {
            const rect = post.getBoundingClientRect();
            return event.clientX > rect.left && event.clientX < rect.right &&
                event.clientY > rect.top && event.clientY < rect.bottom;
        });

        const currentIndex = posts.indexOf(currentPost);
        const targetIndex = posts.indexOf(targetPost);
        console.log(currentIndex, targetIndex);
        if (targetIndex !== -1 && currentIndex !== targetIndex) {
            if (targetIndex < currentIndex) {
            postContainer.insertBefore(currentPost, targetPost);
            } else {
            postContainer.insertBefore(currentPost, targetPost.nextSibling);
            }
        }
    }
  });
});