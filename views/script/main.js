document.querySelectorAll(".box").forEach(box => {
box.onmousemove = e => {
    for (const card of document.getElementsByClassName("box")) {
      const rect = card.getBoundingClientRect(),
            x = e.clientX - rect.left,
            y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
    }
  };
});