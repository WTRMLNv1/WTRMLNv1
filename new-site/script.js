const nav = document.getElementById("nav");
const heroContent = document.getElementById("heroContent");
const themeToggle = document.getElementById("themeToggle");

function updateScrollState() {
  const y = window.scrollY;
  const fadeDistance = Math.max(window.innerHeight * 0.72, 420);
  const opacity = Math.max(0, 1 - y / fadeDistance);

  heroContent.style.opacity = opacity;
  nav.classList.toggle("scrolled", y > 70);
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "wtrmln-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

if (localStorage.getItem("wtrmln-theme") === "dark") {
  document.body.classList.add("dark");
}