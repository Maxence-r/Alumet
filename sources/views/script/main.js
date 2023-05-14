function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

var previewContainers = document.querySelectorAll('.preview-container');

function checkPreviewContainers() {
  previewContainers.forEach(function(container) {
    if (isElementInViewport(container)) {
      container.classList.add('show');
    }
  });
}

window.addEventListener('scroll', checkPreviewContainers);