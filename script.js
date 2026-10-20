const intro = document.getElementById('intro');
const homepage = document.getElementById('homepage');
const skipButton = document.getElementById('skipIntro');
const replayButton = document.getElementById('replayIntro');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let introTimer;

function finishIntro() {
  clearTimeout(introTimer);
  intro.classList.add('finished');
  intro.setAttribute('aria-hidden', 'true');
  skipButton.tabIndex = -1;
  stopIntroAudio();
  homepage.focus({ preventScroll: true });
}

function startIntro() {
  clearTimeout(introTimer);
  intro.classList.remove('finished');
  intro.removeAttribute('aria-hidden');
  skipButton.tabIndex = 0;
  intro.querySelectorAll('.intro-logo, .ripple, .floating-petal').forEach((element) => {
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = '';
  });
  if (audioEnabled) playIntroAudio();
  introTimer = setTimeout(finishIntro, reducedMotion.matches ? 400 : 6500);
}

skipButton.addEventListener('click', finishIntro);
replayButton.addEventListener('click', startIntro);

// Mobile navigation: open and close the links with one button.
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  menuToggle.textContent = isOpen ? '✕' : '☰';
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation menu');
  menuToggle.textContent = '☰';
}));

// Reveal page sections as visitors scroll down.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(element => observer.observe(element));
} else {
  reveals.forEach(element => element.classList.add('visible'));
}

// Version 3: expand and collapse a story when a visitor selects its petal.
document.querySelectorAll('.story-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    const nextOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(nextOpen));
    detail.hidden = !nextOpen;
    button.querySelector('.story-hint').textContent = nextOpen ? 'Close this story' : 'Discover this story';
  });
});

// Show an additional game dropdown only for game-related inquiries.
const topicSelect = document.getElementById('topic');
const gameField = document.getElementById('gameField');
const gameChoice = document.getElementById('gameChoice');
topicSelect.addEventListener('change', () => {
  const isGameInquiry = topicSelect.value === 'Game Feedback & Support';
  gameField.hidden = !isGameInquiry;
  gameChoice.required = isGameInquiry;
  if (!isGameInquiry) gameChoice.value = '';
});

// Submit directly to Formspree, show real success/error feedback.
const contactForm = document.getElementById('contactForm');
const contactButton = document.getElementById('submitContact');
const formStatus = document.getElementById('formStatus');
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  contactButton.disabled = true;
  contactButton.textContent = 'Sending…';
  formStatus.textContent = 'Sending your message…';
  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      let detail = 'Please try again or use the email link above.';
      try {
        const result = await response.json();
        if (Array.isArray(result.errors) && result.errors.length) {
          detail = result.errors.map(error => error.message).filter(Boolean).join(' ');
        }
      } catch (_) {}
      throw new Error(detail);
    }
    contactForm.reset();
    gameField.hidden = true;
    gameChoice.required = false;
    formStatus.textContent = 'Thank you! Your message was sent to Hana Petals Game Studio.';
  } catch (error) {
    formStatus.textContent = `Message not sent. ${error.message || 'Please try again.'}`;
  } finally {
    contactButton.disabled = false;
    contactButton.textContent = 'Send Message ↗';
  }
});

// Version 4: pink development drops and Studio Journal disclosure.
document.querySelectorAll('.drop-toggle').forEach(button=>{
  button.addEventListener('click',()=>{
    const panel=document.getElementById(button.getAttribute('aria-controls'));
    const open=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(open));
    panel.hidden=!open;
  });
});
const journalToggle=document.getElementById('journalToggle');
journalToggle.addEventListener('click',()=>{
  const open=journalToggle.getAttribute('aria-expanded')!=='true';
  journalToggle.setAttribute('aria-expanded',String(open));
  document.getElementById('journalContents').hidden=!open;
});

// Optional synthesized ambient intro tone: no sound files, no autoplay.
const soundButton=document.getElementById('introSound');
let audioEnabled=false;
let audioContext=null;
let audioNodes=[];
function stopIntroAudio(){
  audioNodes.forEach(node=>{try{node.stop()}catch(e){}});audioNodes=[];
}
function playIntroAudio(){
  if(!audioEnabled||intro.classList.contains('finished'))return;
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!audioContext)audioContext=new Context();
  if(audioContext.state==='suspended')audioContext.resume();
  stopIntroAudio();
  const now=audioContext.currentTime;
  [392,523.25,659.25].forEach((freq,i)=>{
    const osc=audioContext.createOscillator();const gain=audioContext.createGain();
    osc.type='sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime(.012,now+.4+i*.45);
    gain.gain.exponentialRampToValueAtTime(.0001,now+4.5+i*.35);
    osc.connect(gain);gain.connect(audioContext.destination);
    osc.start(now+i*.45);osc.stop(now+5+i*.35);audioNodes.push(osc);
  });
}
soundButton.addEventListener('click',()=>{
  audioEnabled=!audioEnabled;
  soundButton.textContent=audioEnabled?'♫ Sound on':'♫ Sound off';
  soundButton.setAttribute('aria-pressed',String(audioEnabled));
  soundButton.setAttribute('aria-label',audioEnabled?'Turn intro sound off':'Turn intro sound on');
  if(audioEnabled)playIntroAudio();else stopIntroAudio();
});

// Initialize only after optional audio state has been declared.
startIntro();
