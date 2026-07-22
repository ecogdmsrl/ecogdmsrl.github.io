window.AppConfig = (function () {
  "use strict";
  const ENCODED_PASSWORD = "bWVqbXMyMDE1";

  function decodePassword(encoded) {
    try {
      return atob(encoded);
    } catch (e) {
      return "";
    }
  }

  function checkPassword(candidate) {
    return candidate === decodePassword(ENCODED_PASSWORD);
  }

  const DEFAULT_MATERIALS = [
    { name: "Deșeu fier greu", pricePerKg: 0.7 },
    { name: "Deșeu fier", pricePerKg: 0.6 },
    { name: "Deșeu alamă", pricePerKg: 11.44 },
    { name: "Deșeu cupru", pricePerKg: 23.36 },
    { name: "Deșeu aluminiu", pricePerKg: 2.64 },
    { name: "Deșeu alu jante", pricePerKg: 4.4 },
    { name: "Deșeu inox", pricePerKg: 2.64 },
    { name: "Deșeu plumb", pricePerKg: 1.82 },
    { name: "Deșeu acumulatoare", pricePerKg: 1.7 },
  ];

  const STORAGE_KEY = "anyagatvetel_materials_v1";
  const CURRENCY_SUFFIX = " RON";

  function loadMaterials() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_MATERIALS.slice();

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_MATERIALS.slice();
      }

      const clean = parsed.filter(function (m) {
        return (
          m &&
          typeof m.name === "string" &&
          m.name.trim() !== "" &&
          typeof m.pricePerKg === "number" &&
          isFinite(m.pricePerKg) &&
          m.pricePerKg >= 0
        );
      });

      return clean.length > 0 ? clean : DEFAULT_MATERIALS.slice();
    } catch (e) {
      return DEFAULT_MATERIALS.slice();
    }
  }

  function saveMaterials(materials) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  }

  function resetMaterials() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasCustomMaterials() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function formatRON(number) {
    const n = isFinite(number) ? number : 0;
    return (
      n.toLocaleString("ro-RO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + CURRENCY_SUFFIX
    );
  }

  function formatKg(number) {
    const n = isFinite(number) ? number : 0;
    return (
      n.toLocaleString("ro-RO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + " kg"
    );
  }

  return {
    checkPassword: checkPassword,
    DEFAULT_MATERIALS: DEFAULT_MATERIALS,
    loadMaterials: loadMaterials,
    saveMaterials: saveMaterials,
    resetMaterials: resetMaterials,
    hasCustomMaterials: hasCustomMaterials,
    formatRON: formatRON,
    formatKg: formatKg,
  };
})();
