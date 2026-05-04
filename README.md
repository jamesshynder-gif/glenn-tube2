# Glenn Tube (Real Firebase + Google + AI setup)

This version upgrades the prototype into a real cloud-connected app:

- **Real authentication** with Firebase Auth:
  - Email/password sign up + sign in
  - Google sign in
- **Real video uploads** with Firebase Storage
- **Real public video feed** from Firestore (everyone can view)
- **Likes** stored in Firestore
- **Real AI generation** using the Google Gemini API
- Orange + black slick UI

## 1) Firebase setup

Create a Firebase project and enable:

1. **Authentication**
   - Enable Email/Password
   - Enable Google provider
2. **Firestore Database**
   - Create in production mode (then set rules)
3. **Storage**
   - Enable Firebase Storage

Then copy your Firebase web config into `app.js` (`firebaseConfig`).

## 2) Gemini API setup

1. Create a Google AI Studio API key for Gemini.
2. Put it in `GEMINI_API_KEY` in `app.js`.

> For production, move API keys and AI calls to a secure backend/Cloud Function.

## 3) Firestore and Storage rules (starter)

Use secure rules so only authenticated users can upload/like, while everyone can read videos.

### Firestore rules (example)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### Storage rules (example)

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 4) Run locally

Because this uses ES modules, serve with a local web server:

```bash
python3 -m http.server 5173
```

Open <http://localhost:5173>.

## Important production notes

- Do **not** keep secrets in frontend JS for production.
- Add file size/type limits, moderation, reporting, and abuse prevention.
- Consider transcoding videos and using signed URLs/CDN for scale.
