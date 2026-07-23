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

  const purchasesList = document.getElementById("purchases-list");
  const addPurchaseBtn = document.getElementById("add-purchase-btn");
  const totalBreakdown = document.getElementById("total-breakdown");
  const materialsTotalValueEl = document.getElementById(
    "materials-total-value",
  );
  const purchasesTotalValueEl = document.getElementById(
    "purchases-total-value",
  );

  const personNameInput = document.getElementById("person-name");
  const personCnpInput = document.getElementById("person-cnp");
  const personCnpError = document.getElementById("person-cnp-error");
  const personLocalityInput = document.getElementById("person-locality");
  const personStreetInput = document.getElementById("person-street");
  const personNrInput = document.getElementById("person-nr");
  const personBlocInput = document.getElementById("person-bloc");
  const personScaraInput = document.getElementById("person-scara");
  const personApInput = document.getElementById("person-ap");
  const personIdInput = document.getElementById("person-id");
  const personIssuedByInput = document.getElementById("person-issued-by");
  const declarationOwnRadio = document.getElementById("declaration-own");
  const vehicleMakeInput = document.getElementById("vehicle-make");
  const vehiclePlateInput = document.getElementById("vehicle-plate");
  const printBtn = document.getElementById("print-btn");
  const officialPrintBtn = document.getElementById("official-print-btn");
  const printArea = document.getElementById("print-area");

  function validatePersonCnp() {
    const raw = personCnpInput.value.trim();
    const isValid = raw === "" || /^[0-9]{13}$/.test(raw);
    personCnpInput.classList.toggle("field-invalid", !isValid);
    personCnpError.classList.toggle("visible", !isValid);
    return isValid;
  }

  personCnpInput.addEventListener("input", validatePersonCnp);

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
      '<div class="field price-type-field" style="display:none">' +
      '<label data-i18n="field_price_type">Ár típusa</label>' +
      '<select class="price-type-select">' +
      '<option value="standard" data-i18n="price_standard_option">Standard</option>' +
      '<option value="extra" data-i18n="price_extra_option">Extra</option>' +
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
    const priceTypeSelect = card.querySelector(".price-type-select");
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
    priceTypeSelect.addEventListener("change", function () {
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

  function getCardPriceType(card, material) {
    if (!AppConfig.materialHasExtraPrice(material)) return "standard";
    const priceTypeSelect = card.querySelector(".price-type-select");
    return priceTypeSelect && priceTypeSelect.value === "extra"
      ? "extra"
      : "standard";
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

    const priceTypeField = card.querySelector(".price-type-field");
    const hasExtraPrice = AppConfig.materialHasExtraPrice(material);
    priceTypeField.style.display = hasExtraPrice ? "flex" : "none";

    const priceType = getCardPriceType(card, material);
    const price = AppConfig.getEffectivePrice(material, priceType);

    if (material) {
      priceEl.textContent = AppConfig.formatRON(price) + "/kg";
      const subtotal = netKg * price;
      subtotalEl.textContent = AppConfig.formatRON(subtotal);
      card.dataset.subtotal = String(subtotal);
    } else {
      priceEl.textContent = "-";
      subtotalEl.textContent = AppConfig.formatRON(0);
      card.dataset.subtotal = "0";
    }

    recalcTotal();
  }

  function addPurchaseRow() {
    const row = document.createElement("div");
    row.className = "item-card purchase-row";

    row.innerHTML =
      '<div class="item-row">' +
      '<div class="field">' +
      '<label data-i18n="purchase_name_label">Termék</label>' +
      '<input type="text" class="purchase-name-input" data-i18n-placeholder="purchase_name_placeholder" placeholder="pl. akkumulátor">' +
      "</div>" +
      '<div class="field">' +
      '<label data-i18n="purchase_price_label">Egységár (RON/db)</label>' +
      '<input type="number" class="purchase-price-input" inputmode="decimal" min="0" step="0.01" placeholder="0">' +
      "</div>" +
      '<div class="field">' +
      '<label data-i18n="purchase_qty_label">Darabszám</label>' +
      '<input type="number" class="purchase-qty-input" inputmode="numeric" min="0" step="1" placeholder="0">' +
      "</div>" +
      '<button type="button" class="remove-btn remove-purchase-btn" data-i18n-title="remove_item_title" title="Tétel törlése">&times;</button>' +
      "</div>" +
      '<div class="item-row purchase-summary">' +
      '<span><span data-i18n="item_subtotal_label">Részösszeg:</span> <strong class="purchase-subtotal-value">0,00 RON</strong></span>' +
      "</div>";

    purchasesList.appendChild(row);

    const nameInput = row.querySelector(".purchase-name-input");
    const priceInput = row.querySelector(".purchase-price-input");
    const qtyInput = row.querySelector(".purchase-qty-input");
    const removeBtn = row.querySelector(".remove-purchase-btn");

    nameInput.addEventListener("input", function () {
      updatePurchaseRow(row);
    });
    priceInput.addEventListener("input", function () {
      updatePurchaseRow(row);
    });
    qtyInput.addEventListener("input", function () {
      updatePurchaseRow(row);
    });
    removeBtn.addEventListener("click", function () {
      row.remove();
      recalcTotal();
    });

    updatePurchaseRow(row);
    AppConfig.applyTranslations();
  }

  function updatePurchaseRow(row) {
    const price = parseFloat(row.querySelector(".purchase-price-input").value);
    const qty = parseFloat(row.querySelector(".purchase-qty-input").value);
    const validPrice = isFinite(price) && price > 0 ? price : 0;
    const validQty = isFinite(qty) && qty > 0 ? qty : 0;
    const subtotal = validPrice * validQty;

    row.dataset.subtotal = String(subtotal);
    row.querySelector(".purchase-subtotal-value").textContent =
      AppConfig.formatRON(subtotal);

    recalcTotal();
  }

  function recalcTotal() {
    let materialsTotal = 0;
    itemsList.querySelectorAll(".item-card").forEach(function (card) {
      materialsTotal += parseFloat(card.dataset.subtotal || "0");
    });

    let purchasesTotal = 0;
    purchasesList.querySelectorAll(".purchase-row").forEach(function (row) {
      purchasesTotal += parseFloat(row.dataset.subtotal || "0");
    });

    const netTotal = materialsTotal - purchasesTotal;

    if (purchasesTotal > 0) {
      totalBreakdown.style.display = "block";
      materialsTotalValueEl.textContent = AppConfig.formatRON(materialsTotal);
      purchasesTotalValueEl.textContent =
        "-" + AppConfig.formatRON(purchasesTotal);
    } else {
      totalBreakdown.style.display = "none";
    }

    totalValueEl.textContent = AppConfig.formatRON(netTotal);
  }

  function refreshEmptyHint() {
    emptyHint.style.display = itemCount() === 0 ? "block" : "none";
  }

  function resetAll() {
    itemsList.innerHTML = "";
    purchasesList.innerHTML = "";
    refreshEmptyHint();
    addPurchaseRow();
    recalcTotal();
    addItemRow();
  }

  addRowBtn.addEventListener("click", addItemRow);
  addPurchaseBtn.addEventListener("click", addPurchaseRow);
  resetBtn.addEventListener("click", function () {
    if (confirm(t("reset_confirm"))) {
      resetAll();
      personNameInput.value = "";
      personCnpInput.value = "";
      validatePersonCnp();
      personLocalityInput.value = "";
      personStreetInput.value = "";
      personNrInput.value = "";
      personBlocInput.value = "";
      personScaraInput.value = "";
      personApInput.value = "";
      personIdInput.value = "";
      personIssuedByInput.value = "";
      declarationOwnRadio.checked = true;
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
      const priceType = getCardPriceType(card, material);
      const price = AppConfig.getEffectivePrice(material, priceType);
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

  function collectPurchasesForPrint() {
    const rows = purchasesList.querySelectorAll(".purchase-row");
    const purchases = [];

    rows.forEach(function (row) {
      const name = row.querySelector(".purchase-name-input").value.trim();
      const price = parseFloat(
        row.querySelector(".purchase-price-input").value,
      );
      const qty = parseFloat(row.querySelector(".purchase-qty-input").value);
      const validPrice = isFinite(price) && price > 0 ? price : 0;
      const validQty = isFinite(qty) && qty > 0 ? qty : 0;

      if (name === "" || validPrice <= 0 || validQty <= 0) return;

      purchases.push({
        name: name,
        price: validPrice,
        qty: validQty,
        subtotal: validPrice * validQty,
      });
    });

    return purchases;
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

  function buildReceiptHTML(
    items,
    materialsTotal,
    purchases,
    purchasesTotal,
    netTotal,
  ) {
    const personName = personNameInput.value.trim();
    const personCnp = personCnpInput.value.trim();
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

    let purchaseRows = "";
    purchases.forEach(function (p, idx) {
      purchaseRows +=
        "<tr>" +
        "<td>" +
        (idx + 1) +
        "</td>" +
        "<td>" +
        escapeHtml(p.name) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(p.price) +
        "</td>" +
        '<td class="num">' +
        p.qty +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(p.subtotal) +
        "</td>" +
        "</tr>";
    });

    const purchasesSectionHtml =
      purchases.length === 0
        ? ""
        : '<div class="receipt-purchases-title">' +
          escapeHtml(t("receipt_purchases_title")) +
          "</div>" +
          "<table>" +
          "<thead><tr>" +
          "<th>#</th><th>" +
          escapeHtml(t("purchase_name_label")) +
          '</th><th class="num">' +
          escapeHtml(t("purchase_price_label")) +
          '</th><th class="num">' +
          escapeHtml(t("purchase_qty_label")) +
          '</th><th class="num">' +
          escapeHtml(t("receipt_col_sum")) +
          "</th>" +
          "</tr></thead>" +
          "<tbody>" +
          purchaseRows +
          "</tbody>" +
          "</table>";

    const breakdownHtml =
      purchasesTotal <= 0
        ? ""
        : '<div class="receipt-breakdown">' +
          "<div>" +
          escapeHtml(t("total_materials_label")) +
          " " +
          AppConfig.formatRON(materialsTotal) +
          "</div>" +
          "<div>" +
          escapeHtml(t("total_purchases_label")) +
          " -" +
          AppConfig.formatRON(purchasesTotal) +
          "</div>" +
          "</div>";

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
      escapeHtml(t("receipt_name_label")) +
      "</strong> " +
      (escapeHtml(personName) || "-") +
      "</div>" +
      "<div><strong>" +
      escapeHtml(t("receipt_cnp_label")) +
      "</strong> " +
      (escapeHtml(personCnp) || "-") +
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
      purchasesSectionHtml +
      breakdownHtml +
      '<div class="receipt-total">' +
      escapeHtml(t("receipt_total_label")) +
      " " +
      AppConfig.formatRON(netTotal) +
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

  // ---------- Romanian number-to-words (for the official "Adeverință" form) ----------

  var RO_UNITS = [
    "zero",
    "unu",
    "doi",
    "trei",
    "patru",
    "cinci",
    "șase",
    "șapte",
    "opt",
    "nouă",
  ];
  var RO_TEENS = [
    "zece",
    "unsprezece",
    "doisprezece",
    "treisprezece",
    "paisprezece",
    "cincisprezece",
    "șaisprezece",
    "șaptesprezece",
    "optsprezece",
    "nouăsprezece",
  ];
  var RO_TENS = [
    "",
    "",
    "douăzeci",
    "treizeci",
    "patruzeci",
    "cincizeci",
    "șaizeci",
    "șaptezeci",
    "optzeci",
    "nouăzeci",
  ];

  function roUnitWord(x, fem) {
    if (fem && x === 1) return "una";
    if (fem && x === 2) return "două";
    return RO_UNITS[x];
  }
  function roUnder100(x, fem) {
    if (x < 10) return roUnitWord(x, fem);
    if (x < 20) return RO_TEENS[x - 10];
    var t = Math.floor(x / 10),
      u = x % 10;
    if (u === 0) return RO_TENS[t];
    return RO_TENS[t] + " și " + roUnitWord(u, fem);
  }
  function roUnder1000(x, fem) {
    if (x < 100) return roUnder100(x, fem);
    var h = Math.floor(x / 100),
      rest = x % 100;
    var hw = h === 1 ? "o sută" : h === 2 ? "două sute" : RO_UNITS[h] + " sute";
    if (rest === 0) return hw;
    return hw + " " + roUnder100(rest, fem);
  }
  function numberToWordsRO(n) {
    n = Math.floor(n);
    if (n === 0) return "zero";
    if (n < 1000) return roUnder1000(n, false);
    var th = Math.floor(n / 1000),
      rest = n % 1000;
    var thw;
    if (th === 1) thw = "o mie";
    else thw = roUnder1000(th, true) + (th < 20 ? " mii" : " de mii");
    if (rest === 0) return thw;
    return thw + " " + roUnder1000(rest, false);
  }
  function amountToWordsLei(amount) {
    var lei = Math.floor(amount + 1e-9);
    var bani = Math.round((amount - lei) * 100);
    if (bani === 100) {
      lei += 1;
      bani = 0;
    }
    var leiWords;
    if (lei === 0) leiWords = "zero lei";
    else if (lei === 1) leiWords = "un leu";
    else if (lei < 20) leiWords = numberToWordsRO(lei) + " lei";
    else leiWords = numberToWordsRO(lei) + " de lei";

    if (bani === 0) return leiWords;

    var baniWords;
    if (bani === 1) baniWords = "un ban";
    else if (bani < 20) baniWords = numberToWordsRO(bani) + " bani";
    else baniWords = numberToWordsRO(bani) + " de bani";

    return leiWords + " și " + baniWords;
  }

  // ---------- Official "Adeverință" form (always Romanian, regardless of UI language) ----------

  function collectItemsForOfficialForm() {
    const cards = itemsList.querySelectorAll(".item-card");
    const items = [];

    cards.forEach(function (card) {
      const select = card.querySelector(".material-select");
      const matIdx = parseInt(select.value, 10);
      const material = MATERIALS[matIdx];
      if (!material) return;

      const mode = card.dataset.mode === "vehicle" ? "vehicle" : "scale";
      const netKg = computeNetKg(card, mode);
      const priceType = getCardPriceType(card, material);
      const price = AppConfig.getEffectivePrice(material, priceType);

      items.push({
        name: material.name,
        netKg: netKg,
        price: price,
        subtotal: netKg * price,
      });
    });

    return items;
  }

  function buildOfficialFormHTML(items, materialsTotal) {
    const dateStr = new Date().toLocaleDateString("ro-RO");

    const personName = personNameInput.value.trim();
    const personCnp = personCnpInput.value.trim();
    const locality = personLocalityInput.value.trim();
    const street = personStreetInput.value.trim();
    const nr = personNrInput.value.trim();
    const bloc = personBlocInput.value.trim();
    const scara = personScaraInput.value.trim();
    const ap = personApInput.value.trim();
    const idSeries = personIdInput.value.trim();
    const issuedBy = personIssuedByInput.value.trim();
    const transportPlate = vehiclePlateInput.value.trim();
    const sourceIsOwn = declarationOwnRadio.checked;

    const NET_FACTOR = 0.88; // 1 - 10% - 2%
    const grossMaterialsTotal = materialsTotal / NET_FACTOR;
    const taxAmount = grossMaterialsTotal * 0.1;
    const fondMediuAmount = grossMaterialsTotal * 0.02;
    const total = grossMaterialsTotal - taxAmount - fondMediuAmount;

    let rows = "";
    items.forEach(function (it) {
      const grossPrice = it.price / NET_FACTOR;
      const grossSubtotal = it.subtotal / NET_FACTOR;
      rows +=
        "<tr>" +
        "<td>" +
        escapeHtml(it.name) +
        "</td>" +
        "<td>kg</td>" +
        '<td class="num">' +
        AppConfig.formatKg(it.netKg) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(grossPrice) +
        "</td>" +
        '<td class="num">' +
        AppConfig.formatRON(grossSubtotal) +
        "</td>" +
        "</tr>";
    });
    // pad up to at least 6 blank rows, matching the paper template
    for (let i = items.length; i < 6; i++) {
      rows += "<tr><td>&nbsp;</td><td>kg</td><td></td><td></td><td></td></tr>";
    }
    rows +=
      "<tr><td>reținere 10% impozit pers. fizice</td><td>kg</td><td></td><td></td>" +
      '<td class="num">-' +
      AppConfig.formatRON(taxAmount) +
      "</td></tr>";
    rows +=
      "<tr><td>reținere 2% fond mediu</td><td></td><td></td><td></td>" +
      '<td class="num">-' +
      AppConfig.formatRON(fondMediuAmount) +
      "</td></tr>";
    rows +=
      '<tr class="official-total-row"><td colspan="4"><strong>TOTAL:</strong></td>' +
      '<td class="num"><strong>' +
      AppConfig.formatRON(total) +
      "</strong></td></tr>";

    const addressParts =
      "str. " +
      (escapeHtml(street) || "-") +
      " nr. " +
      (escapeHtml(nr) || "-") +
      ", bl. " +
      (escapeHtml(bloc) || "-") +
      ", sc. " +
      (escapeHtml(scara) || "-") +
      ", ap. " +
      (escapeHtml(ap) || "-");

    return (
      '<div class="official-form">' +
      '<div class="official-header">' +
      '<div class="official-company">ECO GDM SRL<br>JOSENI Dr.Lazarea 29, jud. Harghita<br>CUI: 47490120</div>' +
      '<div class="official-meta-box">' +
      'Bon de cantar nr. <span class="official-dotted-blank"></span><br>' +
      "Data: <strong>" +
      dateStr +
      "</strong><br>" +
      'Tip deșeu/Kg: <span class="official-dotted-blank"></span>' +
      "</div>" +
      "</div>" +
      '<h2 class="official-title">ADEVERINȚĂ<br><span>de primire și de plată nr. <span class="official-dotted-blank official-dotted-blank-inline"></span></span></h2>' +
      '<p class="official-body">' +
      "S-au primit de la <strong>" +
      (escapeHtml(personName) || "-") +
      "</strong>, domiciliat în localitatea <strong>" +
      (escapeHtml(locality) || "-") +
      "</strong>, " +
      addressParts +
      ", legitimat cu buletinul/cartea de identitate <strong>" +
      (escapeHtml(idSeries) || "-") +
      "</strong>, eliberat/eliberată de SPCLEP <strong>" +
      (escapeHtml(issuedBy) || "-") +
      "</strong>, cod numeric personal <strong>" +
      (escapeHtml(personCnp) || "-") +
      "</strong>, mij. de transp. <strong>" +
      (escapeHtml(transportPlate) || "-") +
      "</strong> următoarele materiale reciclabile:" +
      "</p>" +
      "<table>" +
      "<thead><tr>" +
      "<th>Denumirea materialului și descrierea acestuia</th><th>U.M.</th>" +
      '<th class="num">Cantitatea</th><th class="num">Prețul</th><th class="num">Valoarea</th>' +
      "</tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>" +
      '<div class="official-gestionar">Gestionar primitor,<br>Gál Mihály</div>' +
      '<p class="official-paid-line">S-a achitat suma de <strong>' +
      AppConfig.formatRON(total) +
      "</strong> lei, adică (<strong>" +
      amountToWordsLei(total) +
      "</strong>)</p>" +
      '<div class="official-declaration">' +
      "<p><strong>Deținător,</strong></p>" +
      "<p>1. Cunosc faptul că falsul în declarație constituie infracțiune și se pedepsește conform Codului penal.</p>" +
      "<p>2. Declar pe propria răspundere că materialele pe care le predau provin din:</p>" +
      "<p>" +
      (sourceIsOwn ? "☒" : "☐") +
      " a) gospodăria proprie<br>" +
      (sourceIsOwn ? "☐" : "☒") +
      " b) alte surse</p>" +
      "</div>" +
      '<div class="official-gdpr">' +
      "<p><strong>Acord GDPR</strong></p>" +
      "<p>Conform prevederilor legale continute de Regulamentul (UE)2016/679 privind protectia persoanelor fizice in ceea ce priveste prelucrarea datelor cu caracter personal si faptul ca societatea prelucreaza si stocheaza datele cu caracter personal am luat in cunostinta si sunt de acord (X) nu sunt de acord ( ) cu prelucrarea urmatoarelor date cu caracter personal: nume, prenume, CNP, adresa de domiciliu, serie si numar CI, nr. auto. Scopul prelucrarii: in vederea intocmirii documentelor contabile justificative, transmitere catre OTR-uri sau catre societati similare pe teritoriul Romaniei in baza unei temei legal (contract de prestari servicii), si catre Institutiile Statului Roman. Am fost informat despre exercitarea drepturilor de acces la integritate, stergere, opozitie, portabilitate, etc.</p>" +
      "</div>" +
      '<div class="official-signatures">' +
      '<div class="official-sig-block official-casier">Casier,<div class="official-sig-line"></div></div>' +
      '<div class="official-sig-block official-sig-right">' +
      "De acord, semnătura (amprenta):<br>" +
      'Primitor al sumei,<div class="official-sig-line"></div>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  officialPrintBtn.addEventListener("click", function () {
    const items = collectItemsForOfficialForm();
    if (items.length === 0) {
      alert(t("print_empty_alert"));
      return;
    }

    let materialsTotal = 0;
    items.forEach(function (it) {
      materialsTotal += it.subtotal;
    });

    printArea.classList.remove("print-split-half");
    printArea.innerHTML = buildOfficialFormHTML(items, materialsTotal);
    window.print();
  });

  printBtn.addEventListener("click", function () {
    const items = collectItemsForPrint();
    const purchases = collectPurchasesForPrint();
    if (items.length === 0 && purchases.length === 0) {
      alert(t("print_empty_alert"));
      return;
    }

    let materialsTotal = 0;
    items.forEach(function (it) {
      materialsTotal += it.subtotal;
    });

    let purchasesTotal = 0;
    purchases.forEach(function (p) {
      purchasesTotal += p.subtotal;
    });

    const netTotal = materialsTotal - purchasesTotal;

    const receiptHtml = buildReceiptHTML(
      items,
      materialsTotal,
      purchases,
      purchasesTotal,
      netTotal,
    );

    const measurer = document.createElement("div");
    measurer.style.position = "fixed";
    measurer.style.visibility = "hidden";
    measurer.style.left = "-9999px";
    measurer.style.top = "0";
    measurer.style.width = "640px";
    measurer.innerHTML = receiptHtml;
    document.body.appendChild(measurer);
    const copyHeightPx = measurer.offsetHeight;
    document.body.removeChild(measurer);

    const HALF_PAGE_PX = 1017 / 2;
    const fitsAsHalfPage = copyHeightPx <= HALF_PAGE_PX * 0.92;

    printArea.classList.toggle("print-split-half", fitsAsHalfPage);
    printArea.innerHTML =
      '<div class="receipt-copy">' +
      receiptHtml +
      '</div><div class="receipt-copy">' +
      receiptHtml +
      "</div>";
    window.print();
  });
})();
