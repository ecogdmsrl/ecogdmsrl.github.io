(function () {
  "use strict";

  const AppConfig = window.AppConfig;
  const t = AppConfig.t;

  AppConfig.initLangSwitcher(function () {
    refreshMaterialSelectLabels();
  });

  const loginScreen = document.getElementById("login-screen");
  const appScreen = document.getElementById("app-screen");
  const loginForm = document.getElementById("login-form");
  const passwordInput = document.getElementById("password-input");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");

  let MATERIALS = [];
  const materialsWarning = document.getElementById("materials-warning");
  const loginSubmitBtn = loginForm.querySelector("button[type=submit]");

  async function refreshMaterials() {
    const result = await AppConfig.fetchMaterials();
    MATERIALS = result.materials;
    if (materialsWarning) {
      materialsWarning.style.display = result.ok ? "none" : "block";
    }
    return result;
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
    const originalBtnText = loginSubmitBtn.textContent;
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = t("login_loading");

    await refreshMaterials();

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = originalBtnText;
    loginScreen.style.display = "none";
    appScreen.style.display = "block";
    resetAll();
  });

  logoutBtn.addEventListener("click", function () {
    appScreen.style.display = "none";
    loginScreen.style.display = "flex";
    resetAll();
  });

  const itemsList = document.getElementById("items-list");
  const emptyHint = document.getElementById("empty-hint");
  const totalValueEl = document.getElementById("total-value");
  const addRowBtn = document.getElementById("add-row-btn");
  const resetBtn = document.getElementById("reset-btn");

  const vehicleMakeInput = document.getElementById("vehicle-make");
  const vehiclePlateInput = document.getElementById("vehicle-plate");
  const printBtn = document.getElementById("print-btn");
  const printArea = document.getElementById("print-area");

  function itemCount() {
    return itemsList.querySelectorAll(".item-card").length;
  }

  function buildMaterialOptions(select) {
    select.innerHTML = "";
    MATERIALS.forEach(function (mat, idx) {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = AppConfig.displayMaterialName(mat);
      select.appendChild(opt);
    });
  }

  function refreshMaterialSelectLabels() {
    itemsList.querySelectorAll(".material-select").forEach(function (select) {
      const savedValue = select.value;
      buildMaterialOptions(select);
      select.value = savedValue;
    });
    itemsList.querySelectorAll(".item-card").forEach(function (card) {
      updateItemCard(card);
    });
  }

  function addItemRow() {
    const card = document.createElement("div");
    card.className = "item-card";
    card.dataset.mode = "scale";

    card.innerHTML =
      '<div class="item-row item-row-top">' +
      '<div class="field">' +
      '<label data-i18n="field_material">Anyag</label>' +
      '<select class="material-select"></select>' +
      "</div>" +
      '<div class="field">' +
      '<label data-i18n="field_measure_type">Mérés típusa</label>' +
      '<select class="mode-select">' +
      '<option value="scale" data-i18n="mode_scale_option">Mérlegelés (kis mennyiség)</option>' +
      '<option value="vehicle" data-i18n="mode_vehicle_option">Jármű mérés (nagy mennyiség)</option>' +
      "</select>" +
      "</div>" +
      '<button type="button" class="remove-btn" data-i18n-title="remove_item_title" title="Tétel törlése">&times;</button>' +
      "</div>" +
      '<div class="item-row mode-scale-fields">' +
      '<div class="field">' +
      '<label data-i18n="field_weight_scale">Súly (kg)</label>' +
      '<input type="number" class="kg-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      "</div>" +
      '<div class="item-row mode-vehicle-fields" style="display:none">' +
      '<div class="field">' +
      '<label data-i18n="field_weight_loaded">Tele súly (kg) – jármű + anyag</label>' +
      '<input type="number" class="kg-loaded-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      '<div class="field">' +
      '<label data-i18n="field_weight_empty">Üres súly (kg) – jármű üresen</label>' +
      '<input type="number" class="kg-empty-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      "</div>" +
      '<div class="item-row item-summary">' +
      '<span><span data-i18n="item_net_label">Nettó súly:</span> <strong class="net-kg-value">0 kg</strong></span>' +
      '<span><span data-i18n="item_price_label">Egységár:</span> <strong class="price-value">-</strong></span>' +
      '<span><span data-i18n="item_subtotal_label">Részösszeg:</span> <strong class="subtotal-value">0,00 RON</strong></span>' +
      "</div>";

    itemsList.appendChild(card);

    const select = card.querySelector(".material-select");
    buildMaterialOptions(select);

    const modeSelect = card.querySelector(".mode-select");
    const kgInput = card.querySelector(".kg-input");
    const kgLoadedInput = card.querySelector(".kg-loaded-input");
    const kgEmptyInput = card.querySelector(".kg-empty-input");
    const removeBtn = card.querySelector(".remove-btn");

    select.addEventListener("change", function () {
      updateItemCard(card);
    });
    modeSelect.addEventListener("change", function () {
      updateItemCard(card);
    });
    kgInput.addEventListener("input", function () {
      updateItemCard(card);
    });
    kgLoadedInput.addEventListener("input", function () {
      updateItemCard(card);
    });
    kgEmptyInput.addEventListener("input", function () {
      updateItemCard(card);
    });
    removeBtn.addEventListener("click", function () {
      card.remove();
      refreshEmptyHint();
      recalcTotal();
    });

    updateItemCard(card);
    refreshEmptyHint();
    AppConfig.applyTranslations();
  }

  function computeNetKg(card, mode) {
    if (mode === "scale") {
      const kg = parseFloat(card.querySelector(".kg-input").value);
      return isFinite(kg) && kg > 0 ? kg : 0;
    }
    const loaded = parseFloat(card.querySelector(".kg-loaded-input").value);
    const empty = parseFloat(card.querySelector(".kg-empty-input").value);
    const validLoaded = isFinite(loaded) ? loaded : 0;
    const validEmpty = isFinite(empty) ? empty : 0;
    const diff = validLoaded - validEmpty;
    return diff > 0 ? diff : 0;
  }

  function updateItemCard(card) {
    const select = card.querySelector(".material-select");
    const modeSelect = card.querySelector(".mode-select");
    const mode = modeSelect.value === "vehicle" ? "vehicle" : "scale";
    card.dataset.mode = mode;

    const scaleFields = card.querySelector(".mode-scale-fields");
    const vehicleFields = card.querySelector(".mode-vehicle-fields");
    scaleFields.style.display = mode === "scale" ? "flex" : "none";
    vehicleFields.style.display = mode === "vehicle" ? "flex" : "none";

    const netKg = computeNetKg(card, mode);

    const priceEl = card.querySelector(".price-value");
    const netKgEl = card.querySelector(".net-kg-value");
    const subtotalEl = card.querySelector(".subtotal-value");

    netKgEl.textContent = AppConfig.formatKg(netKg);

    const matIdx = parseInt(select.value, 10);
    const material = MATERIALS[matIdx];

    if (material) {
      priceEl.textContent = AppConfig.formatRON(material.pricePerKg) + "/kg";
      const subtotal = netKg * material.pricePerKg;
      subtotalEl.textContent = AppConfig.formatRON(subtotal);
      card.dataset.subtotal = String(subtotal);
    } else {
      priceEl.textContent = "-";
      subtotalEl.textContent = AppConfig.formatRON(0);
      card.dataset.subtotal = "0";
    }

    recalcTotal();
  }

  function recalcTotal() {
    let total = 0;
    itemsList.querySelectorAll(".item-card").forEach(function (card) {
      total += parseFloat(card.dataset.subtotal || "0");
    });
    totalValueEl.textContent = AppConfig.formatRON(total);
  }

  function refreshEmptyHint() {
    emptyHint.style.display = itemCount() === 0 ? "block" : "none";
  }

  function resetAll() {
    itemsList.innerHTML = "";
    refreshEmptyHint();
    recalcTotal();
    addItemRow();
  }

  addRowBtn.addEventListener("click", addItemRow);
  resetBtn.addEventListener("click", function () {
    if (confirm(t("reset_confirm"))) {
      resetAll();
      vehicleMakeInput.value = "";
      vehiclePlateInput.value = "";
    }
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function collectItemsForPrint() {
    const cards = itemsList.querySelectorAll(".item-card");
    const items = [];

    cards.forEach(function (card) {
      const select = card.querySelector(".material-select");
      const selectedOption = select.options[select.selectedIndex];
      const materialName = selectedOption ? selectedOption.textContent : "-";

      const mode = card.dataset.mode === "vehicle" ? "vehicle" : "scale";
      const netKg = computeNetKg(card, mode);

      const matIdx = parseInt(select.value, 10);
      const material = MATERIALS[matIdx];
      const price = material ? material.pricePerKg : 0;
      const subtotal = netKg * price;

      let modeLabel;
      if (mode === "scale") {
        modeLabel = t("receipt_mode_scale");
      } else {
        const loaded = parseFloat(card.querySelector(".kg-loaded-input").value);
        const empty = parseFloat(card.querySelector(".kg-empty-input").value);
        const validLoaded = isFinite(loaded) ? loaded : 0;
        const validEmpty = isFinite(empty) ? empty : 0;
        modeLabel =
          t("receipt_mode_loaded_prefix") +
          " " +
          AppConfig.formatKg(validLoaded) +
          " − " +
          t("receipt_mode_empty_word") +
          " " +
          AppConfig.formatKg(validEmpty);
      }

      items.push({
        name: materialName,
        modeLabel: modeLabel,
        netKg: netKg,
        price: price,
        subtotal: subtotal,
      });
    });

    return items;
  }

  function generateReceiptId() {
    const now = new Date();
    const pad = function (n) {
      return String(n).padStart(2, "0");
    };
    const datePart =
      now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
    const timePart =
      pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const rand = Math.floor(1000 + Math.random() * 9000);
    return "ATV-" + datePart + "-" + timePart + "-" + rand;
  }

  function buildReceiptHTML(items, total) {
    const make = vehicleMakeInput.value.trim();
    const plate = vehiclePlateInput.value.trim();
    const dateStr = new Date().toLocaleString("ro-RO");
    const receiptId = generateReceiptId();

    let rows = "";
    items.forEach(function (it, idx) {
      rows +=
        "<tr>" +
        "<td>" +
        (idx + 1) +
        "</td>" +
        "<td>" +
        escapeHtml(it.name) +
        "</td>" +
        "<td>" +
        escapeHtml(it.modeLabel) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatKg(it.netKg) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(it.price) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(it.subtotal) +
        "</td>" +
        "</tr>";
    });

    return (
      '<div class="receipt">' +
      '<div class="receipt-logo">' +
      '<span class="receipt-logo-icon" aria-hidden="true">♻️</span>' +
      '<span class="receipt-logo-text">ECO GDM SRL</span>' +
      "</div>" +
      '<div class="receipt-subtitle">' +
      escapeHtml(t("receipt_subtitle")) +
      "</div>" +
      '<div class="receipt-disclaimer">' +
      escapeHtml(t("receipt_disclaimer")) +
      "</div>" +
      '<div class="receipt-meta">' +
      "<div><strong>" +
      escapeHtml(t("receipt_id_label")) +
      "</strong> " +
      escapeHtml(receiptId) +
      "</div>" +
      "<div><strong>" +
      escapeHtml(t("receipt_date_label")) +
      "</strong> " +
      escapeHtml(dateStr) +
      "</div>" +
      "<div><strong>" +
      escapeHtml(t("receipt_make_label")) +
      "</strong> " +
      (escapeHtml(make) || "-") +
      "</div>" +
      "<div><strong>" +
      escapeHtml(t("receipt_plate_label")) +
      "</strong> " +
      (escapeHtml(plate) || "-") +
      "</div>" +
      "</div>" +
      "<table>" +
      "<thead><tr>" +
      "<th>#</th><th>" +
      escapeHtml(t("receipt_col_material")) +
      "</th><th>" +
      escapeHtml(t("receipt_col_measure")) +
      "</th>" +
      '<th class="num">' +
      escapeHtml(t("receipt_col_net")) +
      '</th><th class="num">' +
      escapeHtml(t("receipt_col_price")) +
      '</th><th class="num">' +
      escapeHtml(t("receipt_col_sum")) +
      "</th>" +
      "</tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>" +
      '<div class="receipt-total">' +
      escapeHtml(t("receipt_total_label")) +
      " " +
      AppConfig.formatRON(total) +
      "</div>" +
      '<div class="receipt-fondmediu-note">' +
      escapeHtml(t("receipt_fondmediu_note")) +
      "</div>" +
      '<div class="receipt-signatures">' +
      '<div class="sig-line">' +
      escapeHtml(t("receipt_sig_company")) +
      "</div>" +
      '<div class="sig-line">' +
      escapeHtml(t("receipt_sig_provider")) +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  printBtn.addEventListener("click", function () {
    const items = collectItemsForPrint();
    if (items.length === 0) {
      alert(t("print_empty_alert"));
      return;
    }

    let total = 0;
    items.forEach(function (it) {
      total += it.subtotal;
    });

    printArea.innerHTML = buildReceiptHTML(items, total);
    window.print();
  });
})();
