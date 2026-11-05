const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const logoutButton = document.getElementById("logout-button");
const signedIn = document.getElementById("signed-in");
const authMessage = document.getElementById("auth-message");

// 로그인 여부에 맞게 화면을 바꿉니다.
function showAuthState(session) {
  authForm.hidden = Boolean(session);
  signedIn.hidden = !session;

  if (session) {
    passwordInput.value = "";
  }
}

// 요청 중 중복 클릭을 막습니다.
function setAuthBusy(busy) {
  loginButton.disabled = busy;
  signupButton.disabled = busy;
  logoutButton.disabled = busy;
}

// 로그인 또는 회원가입
async function authenticate(mode) {
  if (!authForm.reportValidity()) return;

  setAuthBusy(true);
  authMessage.textContent = "처리 중이에요.";

  try {
    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    const result = mode === "signup"
      ? await window.examDb.auth.signUp(credentials)
      : await window.examDb.auth.signInWithPassword(credentials);

    if (result.error) throw result.error;

    showAuthState(result.data.session);

    authMessage.textContent = result.data.session
      ? "로그인에 성공했어요."
      : "이메일 확인이 필요한 경우 받은 메일의 확인 링크를 눌러 주세요. 이미 가입했다면 로그인해 주세요.";
  } catch (error) {
    authMessage.textContent =
      "처리하지 못했어요: " + error.message;
  } finally {
    setAuthBusy(false);
  }
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticate("login");
});

signupButton.addEventListener("click", () => {
  authenticate("signup");
});

// 로그아웃
logoutButton.addEventListener("click", async () => {
  setAuthBusy(true);

  try {
    const { error } = await window.examDb.auth.signOut();
    if (error) throw error;

    showAuthState(null);
    authMessage.textContent = "로그아웃했어요.";
  } catch (error) {
    authMessage.textContent =
      "로그아웃하지 못했어요: " + error.message;
  } finally {
    setAuthBusy(false);
  }
});

// 새로고침 후 로그인 상태 확인
async function restoreLogin() {
  try {
    const { data, error } = await window.examDb.auth.getSession();
    if (error) throw error;
    showAuthState(data.session);
  } catch (error) {
    authMessage.textContent =
      "로그인 상태를 확인하지 못했어요: " + error.message;
  }
}

if (window.examDb) {
  window.examDb.auth.onAuthStateChange((_event, session) => {
    showAuthState(session);
  });

  restoreLogin();
} else {
  authMessage.textContent =
    "Supabase 설정을 불러오지 못했어요. 연결 파일을 확인해 주세요.";
  setAuthBusy(true);
}
