import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, isConfigured } from "./firebase.js";
import { COLLECTION } from "./firebase-config.js";
import { REGIONS } from "./regions.js";

const form = document.getElementById("survey-form");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const done = document.getElementById("done");

// 라디오 선택값에 따라 펼쳐지는 추가 입력 영역
const reveals = {
  enrolled: document.getElementById("university-section"),
  attending: document.getElementById("departure-section"),
};

const provinceSelect = document.getElementById("departureProvince");
const citySelect = document.getElementById("departureDetail");
const cityField = document.getElementById("city-field");
const citiesOf = new Map(REGIONS);

function setOptions(select, values) {
  select.replaceChildren(new Option("선택해 주세요", ""), ...values.map((v) => new Option(v, v)));
}

setOptions(provinceSelect, REGIONS.map(([province]) => province));

// 시·도를 바꾸면 해당 시·도의 시·군 목록으로 교체합니다.
function updateCities() {
  const cities = citiesOf.get(provinceSelect.value) || [];
  setOptions(citySelect, cities);
  cityField.hidden = cities.length === 0;
}

provinceSelect.addEventListener("change", updateCities);

if (!isConfigured) {
  document.getElementById("config-warning").hidden = false;
  submitBtn.disabled = true;
}

function toggleReveal(name, open) {
  reveals[name].hidden = !open;
}

form.addEventListener("change", (e) => {
  if (e.target.name in reveals) toggleReveal(e.target.name, e.target.value === "yes");
});

// 숫자만 남겨 010-1234-5678 형식으로 맞춥니다. 휴대전화 번호가 아니면 빈 문자열을 돌려줍니다.
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "");
  const m = digits.match(/^(01[016789])(\d{3,4})(\d{4})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function readForm() {
  const data = new FormData(form);
  const value = (key) => (data.get(key) || "").toString().trim();
  const enrolled = value("enrolled") === "yes";
  const attending = value("attending") === "yes";

  return {
    name: value("name"),
    phone: formatPhone(value("phone")),
    highSchool: value("highSchool"),
    enrolled,
    university: enrolled ? value("university") : "",
    major: enrolled ? value("major") : "",
    attending,
    departureProvince: attending ? value("departureProvince") : "",
    departureDetail: attending ? value("departureDetail") : "",
    enrolledChosen: value("enrolled") !== "",
    attendingChosen: value("attending") !== "",
  };
}

function validate(r) {
  if (!r.name) return "이름을 입력해 주세요.";
  if (!r.phone) return "휴대전화 번호를 올바르게 입력해 주세요. (예: 010-1234-5678)";
  if (!r.highSchool) return "출신 고등학교를 입력해 주세요.";
  if (!r.enrolledChosen) return "대학교 재학 여부를 선택해 주세요.";
  if (r.enrolled && !r.university) return "재학 중인 대학교를 입력해 주세요.";
  if (r.enrolled && !r.major) return "학과를 입력해 주세요.";
  if (!r.attendingChosen) return "참석 여부를 선택해 주세요.";
  if (r.attending && !r.departureProvince) return "출발 지역(시·도)을 선택해 주세요.";
  if (r.attending && (citiesOf.get(r.departureProvince) || []).length && !r.departureDetail) return "출발 지역(시·군)을 선택해 주세요.";
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
    const { enrolledChosen, attendingChosen, ...payload } = r;
    await addDoc(collection(db, COLLECTION), { ...payload, createdAt: serverTimestamp() });
    form.hidden = true;
    done.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  updateCities();
  Object.keys(reveals).forEach((name) => toggleReveal(name, false));
  showError("");
  done.hidden = true;
  form.hidden = false;
});
