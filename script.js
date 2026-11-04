// 과목 버튼과 상세 정보 영역을 찾습니다.
const buttons = document.querySelectorAll("[data-subject]");
const detail = document.getElementById("exam-detail");
const title = document.getElementById("subject-title");
const range = document.getElementById("exam-range");

// 각 과목 버튼을 눌렀을 때 실행할 동작입니다.
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const subject = button.dataset.subject;

    // 선택한 과목 이름과 안내 문구를 표시합니다.
    title.textContent = `${subject} 시험 범위`;
    range.textContent = "아직 등록된 시험 범위가 없습니다.";

    // 숨겨 두었던 상세 정보 영역을 보여 줍니다.
    detail.hidden = false;

    // 선택한 버튼을 표시합니다.
    buttons.forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");

    // 상세 정보가 있는 위치로 이동합니다.
    detail.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });
});
