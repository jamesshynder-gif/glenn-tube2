const authSection = document.getElementById('authSection');
const homeSection = document.getElementById('homeSection');
const authForm = document.getElementById('authForm');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeText = document.getElementById('welcomeText');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('commentList');
const aiBtn = document.getElementById('aiBtn');
const aiOutput = document.getElementById('aiOutput');

const aiIdeas = [
  'Make a fake cooking tutorial where every ingredient is orange.',
  'Review mysterious gadgets in full noir lighting.',
  'Film a “day in the life” but only communicate in meme captions.',
  'Do a dramatic voice-over for everyday chores like they are boss fights.',
  'Rate snack foods based on how suspicious they look at 2am.'
];

function getUser() {
  return localStorage.getItem('glennTubeUser');
}

function setUser(email) {
  localStorage.setItem('glennTubeUser', email);
  localStorage.setItem(`likes_${email}`, localStorage.getItem(`likes_${email}`) || '0');
  localStorage.setItem(`comments_${email}`, localStorage.getItem(`comments_${email}`) || '[]');
}

function renderComments(email) {
  const comments = JSON.parse(localStorage.getItem(`comments_${email}`) || '[]');
  commentList.innerHTML = '';
  comments.forEach((comment) => {
    const li = document.createElement('li');
    li.textContent = comment;
    commentList.appendChild(li);
  });
}

function showHome(email) {
  authSection.classList.add('hidden');
  homeSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  welcomeText.textContent = `Signed in as ${email}`;
  likeCount.textContent = localStorage.getItem(`likes_${email}`) || '0';
  renderComments(email);
}

function showAuth() {
  homeSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  logoutBtn.classList.add('hidden');
}

authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!email || password.length < 6) {
    return;
  }

  setUser(email);
  showHome(email);
  authForm.reset();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('glennTubeUser');
  showAuth();
});

likeBtn.addEventListener('click', () => {
  const email = getUser();
  if (!email) return;
  const newLikes = Number(localStorage.getItem(`likes_${email}`) || '0') + 1;
  localStorage.setItem(`likes_${email}`, String(newLikes));
  likeCount.textContent = String(newLikes);
});

commentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = getUser();
  const comment = commentInput.value.trim();
  if (!email || !comment) return;

  const comments = JSON.parse(localStorage.getItem(`comments_${email}`) || '[]');
  comments.unshift(comment);
  localStorage.setItem(`comments_${email}`, JSON.stringify(comments));

  commentInput.value = '';
  renderComments(email);
});

aiBtn.addEventListener('click', () => {
  const randomIdea = aiIdeas[Math.floor(Math.random() * aiIdeas.length)];
  aiOutput.textContent = `🤖 ${randomIdea}`;
});

const existingUser = getUser();
if (existingUser) {
  showHome(existingUser);
} else {
  showAuth();
}
