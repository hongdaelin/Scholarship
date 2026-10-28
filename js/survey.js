import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, isConfigured } from "./firebase.js";
import { COLLECTION } from "./firebase-config.js";

const form = document.getElementById("survey-form");
const departureSection = document.getElementById("departure-section");
const provinceSelect = document.getElementById("departureProvince");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const done = document.getElementById("done");

if (!isConfigured) {
  document.getElementById("config-warning").hidden = false;
  submitBtn.disabled = true;
}

form.addEventListener("change", (e) => {
  if (e.target.name !== "attending") return;
  const attending = e.target.value === "yes";
  departureSection.hidden = !attending;
  provinceSelect.required = attending;
});

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function readForm() {
  const data = new FormData(form);
  const value = (key) => (data.get(key) || "").toString().trim();
  const attending = value("attending") === "yes";

  return {
    name: value("name"),
    age: Number(value("age")),
    highSchool: value("highSchool"),
    university: value("university"),
    attending,
    departureProvince: attending ? value("departureProvince") : "",
    departureDetail: attending ? value("departureDetail") : "",
    attendingChosen: value("attending") !== "",
  };
}

function validate(r) {
  if (!r.name) return "이름을 입력해 주세요.";
  if (!Number.isInteger(r.age) || r.age < 10 || r.age > 99) return "나이를 올바르게 입력해 주세요. (10~99)";
  if (!r.highSchool) return "출신 고등학교를 입력해 주세요.";
  if (!r.university) return "재학 중인 대학교를 입력해 주세요.";
  if (!r.attendingChosen) return "참석 여부를 선택해 주세요.";
  if (r.attending && !r.departureProvince) return "출발 지역(시·도)을 선택해 주세요.";
  return "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const r = readForm();
  const error = validate(r);
  showError(error);
  if (error) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "제출 중...";
  try {
    const { attendingChosen, ...payload } = r;
    await addDoc(collection(db, COLLECTION), { ...payload, createdAt: serverTimestamp() });
    form.hidden = true;
    done.hidden = false;
  } catch (err) {
    console.error(err);
    showError("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "제출하기";
  }
});

document.getElementById("again-btn").addEventListener("click", () => {
  form.reset();
  departureSection.hidden = true;
  provinceSelect.required = false;
  done.hidden = true;
  form.hidden = false;
});
