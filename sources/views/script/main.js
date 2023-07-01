function isElementInViewport(el) {
  let rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

let previewContainers = document.querySelectorAll('.preview-container');

function checkPreviewContainers() {
  previewContainers.forEach(function(container) {
    if (isElementInViewport(container)) {
      container.classList.add('show');
    }
  });
}

window.addEventListener('scroll', checkPreviewContainers);

document.querySelector('.submit-button').addEventListener('click', function() {
  fetch('/auth/sign-mail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mail: document.querySelector('.mail-zone').value
      })
    })
    .then(function(res) {
      return res.json();
    }
  )
  .then(function(data) {
    document.querySelector('.submit-button').classList.remove('button--loading')
    if (data.error) {
      toast({
        title: "Quelque chose s'est mal passé",
        message: "C'est probablement de notre faute, veuillez réessayer plus tard.",
        type: "error",
        duration: 3000
      })
    } else {
      toast({
        title: "C'est fait !",
        message: `${data.message}`,
        type: "success",
        duration: 3000
      })
    }
  });
});


function FollowTheDevelopment(level) {
  let mail = prompt("Entrez votre adresse mail:")
  if (mail !== null) {
    fetch('/auth/sign-mail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mail: mail,
          level: level
        })
      })
      .then(function(res) {
        return res.json();
      }
    )
    .then(function(data) {
      if (data.error) {
        toast({
          title: "Quelque chose s'est mal passé",
          message: `${data.error}`,
          type: "error",
          duration: 5000
        })
      } else {
        toast({
          title: "C'est fait !",
          message: "Votre inscription au programme est confirmée.",
          type: "success",
          duration: 10000
        })
        if (level == 3) {
          toast({
            title: "C'est fait !",
            message: "Le programme prendra place fin juin, merci de votre patience.",
            type: "info",
            duration: 10000
          })
        }
      }
    });
  }
} 


function closeProgram() {
  document.querySelector('.fdt').style.display = 'none'
}