const firebaseConfig = {
  apiKey: "AIzaSyDKtOdU4PmUQE8_vwaz6k_w_BjRe466dyg",
  authDomain: "data-b61c7.firebaseapp.com",
  projectId: "data-b61c7",
  storageBucket: "data-b61c7.firebasestorage.app",
  messagingSenderId: "570416012500",
  appId: "1:570416012500:web:38004b2438987bc71d2f41",
  measurementId: "G-8K5L52KZLB"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

function showFirebaseError(element, error) {
  if (element) {
    element.textContent = error.message || 'An unexpected error occurred.';
    element.className = 'error-message';
  }
}

function clearMessage(element) {
  if (element) {
    element.textContent = '';
    element.className = '';
  }
}
