
import { initializeApp } from "firebase/app";
import {getStorage} from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDuatC7ZRf6ZvmnuoPhu9SnlAIIviV8EyY",
  authDomain: "fir-learning-db85d.firebaseapp.com",
  projectId: "fir-learning-db85d",
  storageBucket: "fir-learning-db85d.appspot.com",
  messagingSenderId: "458366877000",
  appId: "1:458366877000:web:ffbc7ce19f60b5f633877d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)