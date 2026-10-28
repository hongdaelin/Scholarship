// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱(웹 앱)의 firebaseConfig 값을 그대로 붙여넣으세요.
// 이 값들은 공개되어도 괜찮은 식별자입니다. 데이터 보호는 firestore.rules 가 담당합니다.
export const firebaseConfig = {
  apiKey: "AIzaSyDfOpIl27NGc5TbdFE0v6TZGenNv2Mzng0",
  authDomain: "scholarship-attendance-1212.firebaseapp.com",
  projectId: "scholarship-attendance-1212",
  storageBucket: "scholarship-attendance-1212.firebasestorage.app",
  messagingSenderId: "139968843052",
  appId: "1:139968843052:web:77646c415c9bff83f57089",
};

// 응답이 저장될 Firestore 컬렉션 이름 (firestore.rules 와 일치해야 합니다)
export const COLLECTION = "responses";
