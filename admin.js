import {
  collection, query, orderBy, onSnapshot, doc, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth, isConfigured } from "./firebase.js";
import { COLLECTION } from "./firebase-config.js";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const dashboard = document.getElementById("dashboard");
const rowsEl = document.getElementById("rows");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const filterEl = document.getElementById("filter");

let responses = [];
let unsubscribe = null;

if (!isConfigured) {
  document.getElementById("config-warning").hidden = false;
}

onAuthStateChanged(auth, (user) => {
  loginForm.hidden = !!user;
  dashboard.hidden = !user;
  document.getElementById("logout-btn").hidden = !user;
  if (user) {
    subscribe();
  } else {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    responses = [];
    render();
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value,
    );
  } catch (err) {
    console.error(err);
    loginError.textContent = "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.";
    loginError.hidden = false;
  }
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

function subscribe() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, (snap) => {
    responses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => {
    console.error(err);
    alert("데이터를 불러오지 못했습니다. 관리자 권한(firestore.rules)을 확인해 주세요.");
  });
}

// enrolled 필드가 없는 예전 응답은 대학교 입력 여부로 판단합니다.
function isEnrolled(r) {
  return typeof r.enrolled === "boolean" ? r.enrolled : !!r.university;
}

function departureText(r) {
  if (!r.attending) return "-";
  return [r.departureProvince, r.departureDetail].filter(Boolean).join(" ");
}

function formatDate(ts) {
  if (!ts || typeof ts.toDate !== "function") return "";
  const d = ts.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function visibleResponses() {
  const keyword = searchEl.value.trim().toLowerCase();
  const filter = filterEl.value;
  return responses.filter((r) => {
    if (filter === "yes" && !r.attending) return false;
    if (filter === "no" && r.attending) return false;
    if (!keyword) return true;
    return [r.name, r.highSchool, r.university, r.major, departureText(r)]
      .some((v) => (v || "").toLowerCase().includes(keyword));
  });
}

function cell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function render() {
  const attendingCount = responses.filter((r) => r.attending).length;
  document.getElementById("stat-total").textContent = responses.length;
  document.getElementById("stat-yes").textContent = attendingCount;
  document.getElementById("stat-no").textContent = responses.length - attendingCount;
  document.getElementById("stat-enrolled").textContent = responses.filter(isEnrolled).length;

  const list = visibleResponses();
  rowsEl.replaceChildren();
  list.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.append(
      cell(i + 1),
      cell(r.name),
      cell(r.age),
      cell(r.highSchool),
      cell(isEnrolled(r) ? "재학 중" : "재학 중 아님"),
      cell(isEnrolled(r) ? r.university : "-"),
      cell(isEnrolled(r) ? r.major || "" : "-"),
      cell(r.attending ? "참석" : "불참", r.attending ? "badge badge-yes" : "badge badge-no"),
      cell(departureText(r)),
      cell(formatDate(r.createdAt)),
    );
    const actions = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn-small btn-danger";
    del.textContent = "삭제";
    del.addEventListener("click", () => removeResponse(r));
    actions.append(del);
    tr.append(actions);
    rowsEl.append(tr);
  });
  emptyEl.hidden = list.length > 0;
}

async function removeResponse(r) {
  if (!confirm(`${r.name} 님의 응답을 삭제할까요? 되돌릴 수 없습니다.`)) return;
  try {
    await deleteDoc(doc(db, COLLECTION, r.id));
  } catch (err) {
    console.error(err);
    alert("삭제에 실패했습니다.");
  }
}

searchEl.addEventListener("input", render);
filterEl.addEventListener("change", render);

document.getElementById("export-btn").addEventListener("click", () => {
  const list = visibleResponses();
  if (list.length === 0) {
    alert("내보낼 응답이 없습니다.");
    return;
  }

  const header = ["No.", "이름", "나이", "출신 고등학교", "재학 여부", "대학교", "학과", "참석 여부", "출발 지역(시·도)", "출발 지역(시·군)", "제출 일시"];
  const rows = list.map((r, i) => [
    i + 1,
    r.name,
    r.age,
    r.highSchool,
    isEnrolled(r) ? "재학 중" : "재학 중 아님",
    isEnrolled(r) ? r.university : "",
    isEnrolled(r) ? r.major || "" : "",
    r.attending ? "참석" : "불참",
    r.attending ? r.departureProvince : "",
    r.attending ? r.departureDetail : "",
    formatDate(r.createdAt),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet["!cols"] = [6, 10, 6, 20, 12, 20, 18, 10, 16, 20, 18].map((wch) => ({ wch }));
  sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };

  const byRegion = {};
  list.filter((r) => r.attending).forEach((r) => {
    byRegion[r.departureProvince] = (byRegion[r.departureProvince] || 0) + 1;
  });
  const summaryRows = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);
  const summary = XLSX.utils.aoa_to_sheet([
    ["출발 지역(시·도)", "참석 인원"],
    ...summaryRows,
    ["합계", summaryRows.reduce((sum, [, n]) => sum + n, 0)],
  ]);
  summary["!cols"] = [{ wch: 18 }, { wch: 10 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "응답 목록");
  XLSX.utils.book_append_sheet(book, summary, "지역별 참석 인원");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  XLSX.writeFile(book, `scholarship_attendance_${stamp}.xlsx`);
});
