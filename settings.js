(function () {
  "use strict";

  const AppConfig = window.AppConfig;
  const t = AppConfig.t;
  const TOKEN_STORAGE_KEY = "anyagatvetel_github_token";

  AppConfig.initLangSwitcher();

  const loginScreen = document.getElementById("login-screen");
  const settingsScreen = document.getElementById("settings-screen");
  const loginForm = document.getElementById("login-form");
  const passwordInput = document.getElementById("password-input");
  const loginError = document.getElementById("login-error");
  const loginSubmitBtn = loginForm.querySelector("button[type=submit]");

  const materialsList = document.getElementById("materials-list");
  const addMaterialBtn = document.getElementById("add-material-btn");
  const saveBtn = document.getElementById("save-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const resetDefaultsBtn = document.getElementById("reset-defaults-btn");
  const saveStatus = document.getElementById("save-status");
  const tokenInput = document.getElementById("github-token-input");
  const rememberCheckbox = document.getElementById("remember-token-checkbox");

  function loadRememberedToken() {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      tokenInput.value = saved;
      rememberCheckbox.checked = true;
    }
  }

  rememberCheckbox.addEventListener("change", function () {
    if (!rememberCheckbox.checked) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  });

  function persistTokenIfNeeded() {
    if (rememberCheckbox.checked && tokenInput.value.trim() !== "") {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.value.trim());
    } else if (!rememberCheckbox.checked) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!AppConfig.checkPassword(passwordInput.value)) {
      loginError.textContent = t("login_error");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    loginError.textContent = "";
    passwordInput.value = "";
    const originalText = loginSubmitBtn.textContent;
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = t("login_loading");

    loadRememberedToken();
    const result = await AppConfig.fetchMaterials();

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = originalText;
    loginScreen.style.display = "none";
    settingsScreen.style.display = "block";

    renderMaterials(result.materials);
    if (!result.ok) {
      showStatus(t("status_fetch_fail"), true);
    }
  });

  function renderMaterials(materials) {
    materialsList.innerHTML = "";
    materials.forEach(function (mat) {
      addMaterialRow(mat.name, mat.nameHu, mat.pricePerKg, mat.priceCleanPerKg);
    });
  }

  function addMaterialRow(name, nameHu, price, priceClean) {
    const row = document.createElement("div");
    row.className = "material-row";
    row.innerHTML =
      '<input type="text" class="material-name-input" data-i18n-placeholder="materials_header_name" placeholder="Anyag megnevezése">' +
      '<input type="text" class="material-name-hu-input" data-i18n-placeholder="materials_header_name_hu" placeholder="Magyar név (opcionális)">' +
      '<input type="number" class="material-price-input" min="0" step="0.01" placeholder="0,00">' +
      '<input type="number" class="material-price-clean-input" min="0" step="0.01" placeholder="–">' +
      '<button type="button" class="remove-material-btn" data-i18n-title="remove_item_title" title="Anyag törlése">&times;</button>';

    row.querySelector(".material-name-input").value = name || "";
    row.querySelector(".material-name-hu-input").value = nameHu || "";
    row.querySelector(".material-price-input").value =
      typeof price === "number" ? price : "";
    row.querySelector(".material-price-clean-input").value =
      typeof priceClean === "number" ? priceClean : "";

    row
      .querySelector(".remove-material-btn")
      .addEventListener("click", function () {
        row.remove();
        clearStatus();
      });

    materialsList.appendChild(row);
    AppConfig.applyTranslations();
  }

  function collectMaterials() {
    const rows = materialsList.querySelectorAll(".material-row");
    const materials = [];
    rows.forEach(function (row) {
      const name = row.querySelector(".material-name-input").value.trim();
      const nameHu = row.querySelector(".material-name-hu-input").value.trim();
      const priceRaw = row.querySelector(".material-price-input").value;
      const price = parseFloat(priceRaw);
      const priceCleanRaw = row.querySelector(".material-price-clean-input").value;
      const priceClean = parseFloat(priceCleanRaw);
      if (name !== "" && isFinite(price) && price >= 0) {
        const mat = { name: name, nameHu: nameHu, pricePerKg: price };
        if (priceCleanRaw.trim() !== "" && isFinite(priceClean) && priceClean >= 0) {
          mat.priceCleanPerKg = priceClean;
        }
        materials.push(mat);
      }
    });
    return materials;
  }

  function showStatus(text, isError) {
    saveStatus.textContent = text;
    saveStatus.style.color = isError ? "var(--danger)" : "var(--accent-dark)";
  }

  function clearStatus() {
    saveStatus.textContent = "";
  }

  addMaterialBtn.addEventListener("click", function () {
    addMaterialRow("", "", "");
    clearStatus();
  });

  refreshBtn.addEventListener("click", async function () {
    const originalText = refreshBtn.textContent;
    refreshBtn.disabled = true;
    refreshBtn.textContent = t("login_loading");

    const result = await AppConfig.fetchMaterials();
    renderMaterials(result.materials);

    refreshBtn.disabled = false;
    refreshBtn.textContent = originalText;

    if (result.ok) {
      showStatus(t("status_refreshed"), false);
    } else {
      showStatus(t("status_fetch_fail"), true);
    }
  });

  resetDefaultsBtn.addEventListener("click", function () {
    if (confirm(t("reset_defaults_confirm"))) {
      renderMaterials(AppConfig.DEFAULT_MATERIALS);
      showStatus(t("reset_defaults_done"), false);
    }
  });

  saveBtn.addEventListener("click", async function () {
    const materials = collectMaterials();
    if (materials.length === 0) {
      showStatus(t("status_min_one"), true);
      return;
    }

    const token = tokenInput.value.trim();
    if (!token) {
      showStatus(t("status_need_token"), true);
      return;
    }

    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = t("status_saving");
    showStatus(t("status_saving"), false);

    const result = await AppConfig.saveMaterialsToGitHub(materials, token);

    saveBtn.disabled = false;
    saveBtn.textContent = originalText;

    if (result.ok) {
      persistTokenIfNeeded();
      renderMaterials(materials);
      showStatus(t("status_saved"), false);
    } else {
      showStatus(result.message || "Ismeretlen hiba mentéskor.", true);
    }
  });
})();
