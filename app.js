import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

// Replace with your Firebase project config.
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID'
};

// Optional: Put your Gemini API key here or inject from secure backend.
const GEMINI_API_KEY = 'REPLACE_WITH_GEMINI_API_KEY';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

const authSection = document.getElementById('authSection');
const homeSection = document.getElementById('homeSection');
const authForm = document.getElementById('authForm');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const emailSignOutBtn = document.getElementById('emailSignOutBtn');
const welcomeText = document.getElementById('welcomeText');
const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');
const videoFeed = document.getElementById('videoFeed');
const aiForm = document.getElementById('aiForm');
const aiOutput = document.getElementById('aiOutput');

function showAuth() {
  authSection.classList.remove('hidden');
  homeSection.classList.add('hidden');
  emailSignOutBtn.classList.add('hidden');
}

function showHome(user) {
  authSection.classList.add('hidden');
  homeSection.classList.remove('hidden');
  emailSignOutBtn.classList.remove('hidden');
  welcomeText.textContent = `Signed in as ${user.email || user.displayName}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text || '';
  return div.innerHTML;
}

function renderVideoItem(video) {
  return `
    <article class="video-item">
      <video controls preload="metadata" src="${video.videoUrl}"></video>
      <h4 class="video-title">${escapeHtml(video.title)}</h4>
      <p>${escapeHtml(video.description || '')}</p>
      <div class="video-meta">
        <small>By ${escapeHtml(video.ownerEmail || 'unknown')}</small>
        <button class="small-btn" data-like-id="${video.id}">🧡 Like ${video.likes || 0}</button>
      </div>
    </article>
  `;
}

const videosRef = collection(db, 'videos');
const videosQuery = query(videosRef, orderBy('createdAt', 'desc'));
onSnapshot(videosQuery, (snapshot) => {
  const videos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  videoFeed.innerHTML = videos.map(renderVideoItem).join('');
});

videoFeed.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-like-id]');
  if (!button) return;
  const id = button.getAttribute('data-like-id');
  await updateDoc(doc(db, 'videos', id), { likes: increment(1) });
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    await createUserWithEmailAndPassword(auth, email, password);
  }
  authForm.reset();
});

googleSignInBtn.addEventListener('click', async () => {
  await signInWithPopup(auth, googleProvider);
});

emailSignOutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const title = document.getElementById('titleInput').value.trim();
  const description = document.getElementById('descriptionInput').value.trim();
  const file = document.getElementById('videoInput').files[0];
  if (!title || !file) return;

  uploadStatus.textContent = 'Uploading...';
  const fileRef = ref(storage, `videos/${Date.now()}_${file.name}`);
  const task = uploadBytesResumable(fileRef, file);

  task.on('state_changed', (snap) => {
    const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
    uploadStatus.textContent = `Uploading... ${progress}%`;
  }, (error) => {
    uploadStatus.textContent = `Upload failed: ${error.message}`;
  }, async () => {
    const videoUrl = await getDownloadURL(task.snapshot.ref);
    await addDoc(videosRef, {
      title,
      description,
      videoUrl,
      ownerUid: user.uid,
      ownerEmail: user.email || user.displayName || 'unknown',
      likes: 0,
      createdAt: serverTimestamp()
    });
    uploadStatus.textContent = 'Upload complete!';
    uploadForm.reset();
  });
});

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = document.getElementById('aiPrompt').value.trim();
  if (!prompt) return;

  aiOutput.textContent = 'Generating...';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Give me a catchy YouTube title and short concept for: ${prompt}` }]
        }]
      })
    });
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    aiOutput.textContent = text || 'No AI output received. Check API key and billing.';
  } catch (error) {
    aiOutput.textContent = `AI request failed: ${error.message}`;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) showHome(user);
  else showAuth();
});
