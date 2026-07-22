(function () {
  "use strict";

  const AppConfig = window.AppConfig;

  const loginScreen = document.getElementById("login-screen");
  const appScreen = document.getElementById("app-screen");
  const loginForm = document.getElementById("login-form");
  const passwordInput = document.getElementById("password-input");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");

  let MATERIALS = [];

  function refreshMaterials() {
    MATERIALS = AppConfig.loadMaterials();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (AppConfig.checkPassword(passwordInput.value)) {
      refreshMaterials();
      loginScreen.style.display = "none";
      appScreen.style.display = "block";
      loginError.textContent = "";
      passwordInput.value = "";
      if (itemCount() === 0) addItemRow();
    } else {
      loginError.textContent = "Hibás jelszó.";
      passwordInput.value = "";
      passwordInput.focus();
    }
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

  // ---------------------------------------------------------
  // Jármű adatok + nyomtatás (nincs mentés, csak a nyomtatáshoz)
  // ---------------------------------------------------------
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
      opt.textContent = mat.name;
      select.appendChild(opt);
    });
  }

  function addItemRow() {
    const card = document.createElement("div");
    card.className = "item-card";
    card.dataset.mode = "scale";

    card.innerHTML =
      '<div class="item-row item-row-top">' +
      '<div class="field">' +
      "<label>Anyag</label>" +
      '<select class="material-select"></select>' +
      "</div>" +
      '<div class="field">' +
      "<label>Mérés típusa</label>" +
      '<select class="mode-select">' +
      '<option value="scale">Mérlegelés (kis mennyiség)</option>' +
      '<option value="vehicle">Jármű mérés (nagy mennyiség)</option>' +
      "</select>" +
      "</div>" +
      '<button type="button" class="remove-btn" title="Tétel törlése">&times;</button>' +
      "</div>" +
      '<div class="item-row mode-scale-fields">' +
      '<div class="field">' +
      "<label>Súly (kg)</label>" +
      '<input type="number" class="kg-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      "</div>" +
      '<div class="item-row mode-vehicle-fields" style="display:none">' +
      '<div class="field">' +
      "<label>Tele súly (kg) – jármű + anyag</label>" +
      '<input type="number" class="kg-loaded-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      '<div class="field">' +
      "<label>Üres súly (kg) – jármű üresen</label>" +
      '<input type="number" class="kg-empty-input" inputmode="decimal" min="0" step="0.1" placeholder="0">' +
      "</div>" +
      "</div>" +
      '<div class="item-row item-summary">' +
      '<span>Nettó súly: <strong class="net-kg-value">0 kg</strong></span>' +
      '<span>Egységár: <strong class="price-value">-</strong></span>' +
      '<span>Részösszeg: <strong class="subtotal-value">0,00 RON</strong></span>' +
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
    if (confirm("Biztosan törlöd az összes tételt és új klienssel kezded?")) {
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
        modeLabel = "Mérlegelve";
      } else {
        const loaded = parseFloat(card.querySelector(".kg-loaded-input").value);
        const empty = parseFloat(card.querySelector(".kg-empty-input").value);
        const validLoaded = isFinite(loaded) ? loaded : 0;
        const validEmpty = isFinite(empty) ? empty : 0;
        modeLabel =
          "Tele " +
          AppConfig.formatKg(validLoaded) +
          " − üres " +
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

  function buildReceiptHTML(items, total) {
    const make = vehicleMakeInput.value.trim();
    const plate = vehiclePlateInput.value.trim();
    const dateStr = new Date().toLocaleString("ro-RO");

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
      '<div class="receipt-subtitle">Átvételi elismervény</div>' +
      '<div class="receipt-disclaimer">' +
      "Ez NEM hivatalos bizonylat, kizárólag tájékoztató jellegű, belső elismervény az átvett anyagról és a kifizetett összegről. " +
      "Hivatalos számla vagy bizonylat igénylése esetén kérje a cég hivatalos kiállítású dokumentumát." +
      "</div>" +
      '<div class="receipt-meta">' +
      "<div><strong>Dátum:</strong> " +
      escapeHtml(dateStr) +
      "</div>" +
      "<div><strong>Autó márkája:</strong> " +
      (escapeHtml(make) || "-") +
      "</div>" +
      "<div><strong>Rendszám:</strong> " +
      (escapeHtml(plate) || "-") +
      "</div>" +
      "</div>" +
      "<table>" +
      "<thead><tr>" +
      "<th>#</th><th>Anyag</th><th>Mérés</th>" +
      '<th class="num">Nettó súly</th><th class="num">Egységár</th><th class="num">Összeg</th>' +
      "</tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>" +
      '<div class="receipt-total">Fizetett összeg: ' +
      AppConfig.formatRON(total) +
      "</div>" +
      "</div>"
    );
  }

  printBtn.addEventListener("click", function () {
    const items = collectItemsForPrint();
    if (items.length === 0) {
      alert("Nincs tétel a nyomtatáshoz. Adj hozzá legalább egy anyagot.");
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
