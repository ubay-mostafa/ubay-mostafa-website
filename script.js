
const body = document.body;
const menu = document.getElementById('sideMenu');
const backdrop = document.getElementById('menuBackdrop');
const closeBtn = document.getElementById('closeMenu');
const menuBtn = document.querySelector('.fa-bars') || document.querySelector('.menu-btn');

menuBtn.onclick = () => {
  body.classList.add('menu-open');
  backdrop.hidden = false;
  menu.setAttribute('aria-hidden', 'false');
};
closeBtn.onclick = backdrop.onclick = () => {
  body.classList.remove('menu-open');
  backdrop.hidden = true;
  menu.setAttribute('aria-hidden', 'true');
};
document.addEventListener('keydown', e => e.key == 'Escape' && body.classList.remove('menu-open'));


window.onload = () => {
  document.querySelector('.intro')?.classList.add('animate-in', 'intro');
  setTimeout(() => document.querySelector('.coder')?.classList.add('animate-in', 'coder'), 150);
};

//  slider
const slider = document.getElementById('revealSlider');
const box = document.getElementById('contactReveal');
const reset = document.getElementById('revealReset');

if (slider && box) {
  const max = +slider.max || 100, done = max * 0.95;
  const color = v => slider.style.background =
    `linear-gradient(90deg,#22c55e ${v / max * 100}%,#2a2a2a ${v / max * 100}%)`;

  const update = v => {
    color(v);
    box.classList.toggle('visible', v >= done);
    box.setAttribute('aria-hidden', v >= done ? 'false' : 'true');
  };

  update(slider.value);
  slider.oninput = e => update(e.target.value);
  reset.onclick = () => { slider.value = 0; update(0); };
}

