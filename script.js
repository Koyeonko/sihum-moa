const buttons = document.querySelectorAll("[data-subject]");
const detail = document.getElementById("exam-detail");
const title = document.getElementById("subject-title");
const range = document.getElementById("exam-range");
const input = document.getElementById("range-input");
const saveButton = document.getElementById("save-range");
const message = document.getElementById("save-message");
const sourceInput = document.getElementById("source-input");

let selectedSubject = "";

// 과목별로 서로 다른 이름으로 저장합니다.
function storageKey(subject) {
  return `siheom-moa-range-${subject}`;
}

// 과목 선택
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSubject = button.dataset.subject;

    title.textContent = `${selectedSubject} 시험 범위`;
    message.textContent = "";

    let savedRange = "";

    try {
      savedRange =
        localStorage.getItem(storageKey(selectedSubject)) || "";
    } catch {
      message.textContent =
        "브라우저에서 저장된 내용을 불러올 수 없습니다.";
    }

    range.textContent =
      savedRange || "아직 등록된 시험 범위가 없습니다.";
    input.value = savedRange;
    sourceInput.value = "";

try {
  sourceInput.value =
    localStorage.getItem(storageKey(selectedSubject) + "-source") || "";
} catch {
  message.textContent = "안내 출처를 불러올 수 없습니다.";
}
    detail.hidden = false;

    buttons.forEach((item) => {
      const isSelected = item === button;
      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    detail.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });
});

// 선택한 과목의 시험 범위 저장
saveButton.addEventListener("click", () => {
  if (!selectedSubject) return;

  const text = input.value.trim();
  const source = sourceInput.value.trim();

  if (!text) {
    message.textContent = "시험 범위를 입력해 주세요.";
    return;
  }

  try {
    localStorage.setItem(storageKey(selectedSubject), text);
    localStorage.setItem(
  storageKey(selectedSubject) + "-source",
  source
);
    range.textContent = text;
    message.textContent = "이 브라우저에 저장했어요.";
  } catch {
    message.textContent =
      "저장하지 못했어요. 브라우저의 저장 설정을 확인해 주세요.";
  }
});
