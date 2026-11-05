const buttons = document.querySelectorAll("[data-subject]");
const detail = document.getElementById("exam-detail");
const title = document.getElementById("subject-title");
const range = document.getElementById("exam-range");
const input = document.getElementById("range-input");
const saveButton = document.getElementById("save-range");
const message = document.getElementById("save-message");
const sourceInput = document.getElementById("source-input");

let selectedSubject = "";
let loadingNumber = 0;
let saving = false;

// 저장된 내용의 줄바꿈을 화면에도 표시합니다.
range.style.whiteSpace = "pre-wrap";
saveButton.textContent = "범위 추가";

// 로그인 상태 확인
async function getExamSession() {
  if (!window.examDb) {
    throw new Error("Supabase 연결 설정을 확인해 주세요.");
  }

  const { data, error } = await window.examDb.auth.getSession();

  if (error) throw error;

  return data.session;
}

// 선택한 과목의 공용 시험 범위 불러오기
async function loadRanges() {
  const subject = selectedSubject;
  if (!subject) return;

  const requestNumber = ++loadingNumber;
  range.textContent = "시험 범위를 불러오는 중이에요.";

  try {
    const session = await getExamSession();

    // 다른 과목으로 이동했다면 이전 요청은 표시하지 않습니다.
    if (requestNumber !== loadingNumber) return false;

    if (!session) {
      range.textContent = "로그인 후 시험 범위를 확인할 수 있어요.";
      return false;
    }

    const { data, error } = await window.examDb
      .from("exam_ranges")
      .select("id, content, source, created_at, author_id")
      .eq("subject", subject)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    if (requestNumber !== loadingNumber) return false;

    range.replaceChildren();

if (data.length === 0) {
  range.textContent = "아직 등록된 시험 범위가 없습니다.";
}

data.forEach((entry, index) => {
  const item = document.createElement("span");
  item.style.display = "block";
  item.style.marginBottom = "18px";

  const content = document.createElement("span");
  const sourceText = entry.source
    ? `\n안내 출처: ${entry.source}`
    : "";

  content.textContent =
    `${index + 1}. ${entry.content}${sourceText}`;

  item.appendChild(content);

  // 현재 로그인한 사람이 작성한 항목에만 버튼을 표시합니다.
  if (entry.author_id === session.user.id) {
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "수정";
  editButton.style.marginLeft = "12px";
  editButton.style.width = "auto";

  editButton.addEventListener("click", () => {
    openRangeEditor(entry, item);
  });

  item.appendChild(editButton);

  const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.setAttribute(
      "aria-label",
      `${index + 1}번 시험 범위 삭제`
    );
    deleteButton.style.marginLeft = "12px";
    deleteButton.style.width = "auto";

    deleteButton.addEventListener("click", () => {
      deleteRange(entry.id);
    });

    item.appendChild(deleteButton);
  }

  range.appendChild(item);
});
    return true;
  } catch (error) {
    if (requestNumber !== loadingNumber) return false;

    range.textContent = "시험 범위를 불러오지 못했어요.";
    message.textContent = "불러오기 오류: " + error.message;
    return false;
  }
}

// 저장 중에는 중복 클릭과 과목 변경을 막습니다.
function setRangeBusy(busy) {
  saving = busy;
  saveButton.disabled = busy;
  input.disabled = busy;
  sourceInput.disabled = busy;

  buttons.forEach((button) => {
    button.disabled = busy;
  });

  saveButton.textContent = busy ? "저장 중…" : "범위 추가";
}

// 과목 선택
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    if (saving) return;

    selectedSubject = button.dataset.subject;
    title.textContent = `${selectedSubject} 시험 범위`;
    message.textContent = "";
    input.value = "";
    sourceInput.value = "";
    detail.hidden = false;

    buttons.forEach((item) => {
      const isSelected = item === button;
      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    loadRanges();

    detail.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });
});

// 공용 데이터베이스에 새 시험 범위 추가
saveButton.addEventListener("click", async () => {
  if (!selectedSubject || saving) return;

  const subject = selectedSubject;
  const text = input.value.trim();
  const source = sourceInput.value.trim();

  if (!text) {
    message.textContent = "추가할 시험 범위를 입력해 주세요.";
    return;
  }

  if (text.length > 3000 || source.length > 200) {
    message.textContent =
      "시험 범위는 3,000자, 안내 출처는 200자 이내로 입력해 주세요.";
    return;
  }

  setRangeBusy(true);
  message.textContent = "저장 중이에요.";

  try {
    const session = await getExamSession();

    if (!session) {
      message.textContent = "먼저 로그인해 주세요.";
      return;
    }

    const { error } = await window.examDb
      .from("exam_ranges")
      .insert({
        subject: subject,
        content: text,
        source: source,
        author_id: session.user.id
      });

    if (error) throw error;

    // 저장에 성공했을 때만 입력 칸을 비웁니다.
    input.value = "";
    sourceInput.value = "";

    const loaded = await loadRanges();

    message.textContent = loaded
      ? "공용 시험 범위에 추가했어요."
      : "저장은 완료됐지만 목록을 다시 불러오지 못했어요. 과목 버튼을 다시 눌러 주세요.";
  } catch (error) {
    message.textContent = "저장하지 못했어요: " + error.message;
  } finally {
    setRangeBusy(false);
  }
});

// 로그인하거나 로그아웃하면 표시 내용도 갱신합니다.
if (window.examDb) {
  window.examDb.auth.onAuthStateChange(() => {
    // 진행 중인 이전 조회 결과는 표시하지 않습니다.
    loadingNumber++;
    range.textContent = "";

    setTimeout(() => {
      if (selectedSubject && !saving) {
        message.textContent = "";
        loadRanges();
      }
    }, 0);
  });
}
// 내가 작성한 시험 범위 한 개 삭제
async function deleteRange(entryId) {
  if (saving) return;

  const confirmed = window.confirm(
    "이 시험 범위를 삭제할까요?\n삭제하면 되돌릴 수 없어요."
  );

  if (!confirmed) return;

  setRangeBusy(true);
  message.textContent = "삭제 중이에요.";

  try {
    const session = await getExamSession();

    if (!session) {
      throw new Error("먼저 로그인해 주세요.");
    }

    const { data, error } = await window.examDb
      .from("exam_ranges")
      .delete()
      .eq("id", entryId)
      .eq("author_id", session.user.id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        "이미 삭제된 항목이거나 삭제 권한이 없어요. 과목을 다시 선택해 주세요."
      );
    }

    const loaded = await loadRanges();

    message.textContent = loaded
      ? "선택한 시험 범위를 삭제했어요."
      : "삭제는 완료됐지만 목록을 불러오지 못했어요. 과목 버튼을 다시 눌러 주세요.";
  } catch (error) {
    message.textContent = "삭제하지 못했어요: " + error.message;
  } finally {
    setRangeBusy(false);
  }
}
// 선택한 항목을 수정할 입력창을 표시합니다.
function openRangeEditor(entry, item) {
  if (saving) return;

  const editor = document.createElement("span");
  editor.style.display = "block";

  const contentLabel = document.createElement("label");
  contentLabel.textContent = "시험 범위 수정";

  const contentField = document.createElement("textarea");
  contentField.rows = 5;
  contentField.maxLength = 3000;
  contentField.value = entry.content;
  contentField.style.display = "block";
  contentField.style.width = "100%";
  contentField.style.boxSizing = "border-box";
  contentLabel.appendChild(contentField);

  const sourceLabel = document.createElement("label");
  sourceLabel.textContent = "안내 출처 수정";

  const sourceField = document.createElement("input");
  sourceField.type = "text";
  sourceField.maxLength = 200;
  sourceField.value = entry.source || "";
  sourceField.style.display = "block";
  sourceField.style.width = "100%";
  sourceField.style.boxSizing = "border-box";
  sourceLabel.appendChild(sourceField);

  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.textContent = "수정 저장";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "취소";

  const editorMessage = document.createElement("span");
  editorMessage.style.display = "block";
  editorMessage.setAttribute("role", "status");

  // 취소하면 저장하지 않고 원래 항목을 다시 표시합니다.
  cancelButton.addEventListener("click", () => {
    if (saving) return;
    editor.replaceWith(item);
  });

  updateButton.addEventListener("click", async () => {
    if (saving) return;

    const content = contentField.value.trim();
    const source = sourceField.value.trim();

    if (!content) {
      editorMessage.textContent = "시험 범위를 입력해 주세요.";
      return;
    }

    if (content.length > 3000 || source.length > 200) {
      editorMessage.textContent =
        "시험 범위는 3,000자, 출처는 200자 이내로 입력해 주세요.";
      return;
    }

    setRangeBusy(true);
    updateButton.disabled = true;
    cancelButton.disabled = true;
    contentField.disabled = true;
    sourceField.disabled = true;
    editorMessage.textContent = "수정 내용을 저장 중이에요.";

    try {
      const session = await getExamSession();

      if (!session) {
        throw new Error("먼저 로그인해 주세요.");
      }

      const { data, error } = await window.examDb
        .from("exam_ranges")
        .update({
          content: content,
          source: source
        })
        .eq("id", entry.id)
        .eq("author_id", session.user.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "항목이 삭제됐거나 수정 권한이 없어요."
        );
      }

      const loaded = await loadRanges();

      message.textContent = loaded
        ? "시험 범위를 수정했어요."
        : "수정은 저장됐지만 목록을 불러오지 못했어요. 과목 버튼을 다시 눌러 주세요.";
    } catch (error) {
      editorMessage.textContent =
        "수정하지 못했어요: " + error.message;
    } finally {
      setRangeBusy(false);
      updateButton.disabled = false;
      cancelButton.disabled = false;
      contentField.disabled = false;
      sourceField.disabled = false;
    }
  });

  editor.append(
    contentLabel,
    sourceLabel,
    updateButton,
    cancelButton,
    editorMessage
  );

  item.replaceWith(editor);
  contentField.focus();
}
