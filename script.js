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
    input.value = "";
sourceInput.value = "";
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

// 선택한 과목에 새 시험 범위 추가
saveButton.addEventListener("click", () => {
  if (!selectedSubject) return;

  const text = input.value.trim();
  const source = sourceInput.value.trim();

  if (!text) {
    message.textContent = "추가할 시험 범위를 입력해 주세요.";
    return;
  }

  try {
    // 기존에 저장한 내용을 불러옵니다.
    const previous =
      localStorage.getItem(storageKey(selectedSubject)) || "";

    // 이번에 입력한 범위에 출처를 붙입니다.
    const newEntry = source
      ? `${text}\n안내 출처: ${source}`
      : text;

    // 기존 내용 아래에 새 내용을 추가합니다.
    const updated = previous
      ? `${previous}\n\n${newEntry}`
      : newEntry;

    localStorage.setItem(storageKey(selectedSubject), updated);

    range.textContent = updated;

    // 다음 내용을 입력할 수 있도록 입력 칸을 비웁니다.
    input.value = "";
    sourceInput.value = "";
    message.textContent = "시험 범위를 추가했어요.";
  } catch {
    message.textContent =
      "저장하지 못했어요. 브라우저의 저장 설정을 확인해 주세요.";
  }
});
