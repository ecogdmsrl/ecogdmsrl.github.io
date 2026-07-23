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

  const GITHUB_OWNER = "ecogdmsrl";
  const GITHUB_REPO = "ecogdmsrl.github.io";
  const GITHUB_BRANCH = "main";
  const MATERIALS_FILE = "materials.json";

  const RAW_MATERIALS_URL =
    "https://raw.githubusercontent.com/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/" +
    GITHUB_BRANCH +
    "/" +
    MATERIALS_FILE;

  const API_CONTENTS_URL =
    "https://api.github.com/repos/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/contents/" +
    MATERIALS_FILE;

  const DEFAULT_MATERIALS = [
    { name: "Deșeu fier greu", nameHu: "Nehéz vashulladék", pricePerKg: 0.7 },
    { name: "Deșeu fier", nameHu: "Vashulladék", pricePerKg: 0.6 },
    { name: "Deșeu alamă", nameHu: "Sárgarézhulladék", pricePerKg: 11.44 },
    { name: "Deșeu cupru", nameHu: "Rézhulladék", pricePerKg: 23.36 },
    { name: "Deșeu aluminiu", nameHu: "Alumíniumhulladék", pricePerKg: 2.64 },
    {
      name: "Deșeu alu jante",
      nameHu: "Alumínium felni hulladék",
      pricePerKg: 4.4,
    },
    {
      name: "Deșeu inox",
      nameHu: "Inox (rozsdamentes acél) hulladék",
      pricePerKg: 2.64,
    },
    { name: "Deșeu plumb", nameHu: "Ólomhulladék", pricePerKg: 1.82 },
    {
      name: "Deșeu acumulatoare",
      nameHu: "Akkumulátor hulladék",
      pricePerKg: 1.7,
    },
  ];

  const CURRENCY_SUFFIX = " RON";

  function sanitizeMaterials(parsed) {
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (m) {
        return (
          m &&
          typeof m.name === "string" &&
          m.name.trim() !== "" &&
          typeof m.pricePerKg === "number" &&
          isFinite(m.pricePerKg) &&
          m.pricePerKg >= 0
        );
      })
      .map(function (m) {
        const clean = {
          name: m.name,
          nameHu: typeof m.nameHu === "string" ? m.nameHu : "",
          pricePerKg: m.pricePerKg,
        };
        if (
          typeof m.priceExtraPerKg === "number" &&
          isFinite(m.priceExtraPerKg) &&
          m.priceExtraPerKg >= 0
        ) {
          clean.priceExtraPerKg = m.priceExtraPerKg;
        }
        return clean;
      });
  }

  function displayMaterialName(material) {
    if (!material) return "";
    if (
      getLang() === "hu" &&
      material.nameHu &&
      material.nameHu.trim() !== ""
    ) {
      return material.nameHu;
    }
    return material.name;
  }

  function materialHasExtraPrice(material) {
    return (
      !!material &&
      typeof material.priceExtraPerKg === "number" &&
      isFinite(material.priceExtraPerKg)
    );
  }

  function getEffectivePrice(material, priceType) {
    if (!material) return 0;
    if (priceType === "extra" && materialHasExtraPrice(material)) {
      return material.priceExtraPerKg;
    }
    return material.pricePerKg;
  }

  async function fetchMaterials() {
    try {
      const res = await fetch(RAW_MATERIALS_URL + "?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const parsed = await res.json();
      const clean = sanitizeMaterials(parsed);
      if (clean.length > 0) {
        return { materials: clean, ok: true };
      }
      return { materials: DEFAULT_MATERIALS.slice(), ok: false };
    } catch (e) {
      return { materials: DEFAULT_MATERIALS.slice(), ok: false, error: e };
    }
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach(function (b) {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  async function saveMaterialsToGitHub(materials, token) {
    if (!token) {
      return { ok: false, message: "Hiányzik a GitHub hozzáférési token." };
    }

    const headers = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
    };

    let sha;
    try {
      const getRes = await fetch(API_CONTENTS_URL, {
        headers: headers,
        cache: "no-store",
      });
      if (getRes.status === 200) {
        const info = await getRes.json();
        sha = info.sha;
      } else if (getRes.status !== 404) {
        const errBody = await getRes.text();
        return {
          ok: false,
          message:
            "Hiba a jelenlegi fájl lekérésekor (" +
            getRes.status +
            "): " +
            errBody,
        };
      }
    } catch (e) {
      return {
        ok: false,
        message: "Hálózati hiba a mentés előkészítésekor: " + e.message,
      };
    }

    const content = JSON.stringify(materials, null, 2);
    const body = {
      message: "Árlista frissítve (" + new Date().toISOString() + ")",
      content: utf8ToBase64(content),
      branch: GITHUB_BRANCH,
    };
    if (sha) body.sha = sha;

    try {
      const putRes = await fetch(API_CONTENTS_URL, {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify(body),
      });
      if (putRes.ok) {
        return { ok: true };
      }
      const errJson = await putRes.json().catch(function () {
        return {};
      });
      return {
        ok: false,
        message:
          "GitHub hiba (" +
          putRes.status +
          "): " +
          (errJson.message || "ismeretlen hiba"),
      };
    } catch (e) {
      return { ok: false, message: "Hálózati hiba mentéskor: " + e.message };
    }
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

  const LANG_STORAGE_KEY = "anyagatvetel_lang";
  const DEFAULT_LANG = "hu";

  const TRANSLATIONS = {
    hu: {
      login_password_placeholder: "Jelszó",
      login_button: "Belépés",
      login_loading: "Betöltés…",
      login_error: "Hibás jelszó.",

      calc_login_title: "Anyagátvétel kalkulátor",
      calc_login_subtitle: "Belső eszköz a felvásárlási elszámoláshoz",
      calc_header_title: "Anyagátvétel kalkulátor",
      settings_link: "Beállítások",
      logout_button: "Kilépés",
      materials_warning:
        "Nem sikerült elérni a legfrissebb árlistát az internetről — alapértelmezett árak jelennek meg, amíg nincs kapcsolat.",
      person_card_title: "Személy adatai",
      person_name_label: "Név",
      person_name_placeholder: "pl. Kovács János",
      person_cnp_label: "CNP",
      person_cnp_placeholder: "1234567890123",
      vehicle_card_title: "Jármű adatai",
      vehicle_make_label: "Autó márkája",
      vehicle_make_placeholder: "pl. Volkswagen",
      vehicle_plate_label: "Rendszám",
      vehicle_plate_placeholder: "pl. HR12ABC",
      field_material: "Anyag",
      field_measure_type: "Mérés típusa",
      mode_scale_option: "Mérlegelés (kis mennyiség)",
      mode_vehicle_option: "Jármű mérés (nagy mennyiség)",
      field_price_type: "Ár típusa",
      price_standard_option: "Standard",
      price_extra_option: "Extra",
      remove_item_title: "Tétel törlése",
      field_weight_scale: "Súly (kg)",
      field_weight_loaded: "Tele súly (kg) – jármű + anyag",
      field_weight_empty: "Üres súly (kg) – jármű üresen",
      item_net_label: "Nettó súly:",
      item_price_label: "Egységár:",
      item_subtotal_label: "Részösszeg:",
      empty_hint: "Nincs még tétel. Adj hozzá egyet lent.",
      add_item_button: "+ Új tétel",
      purchases_section_title: "Vásárolt termékek (levonás az összegből)",
      add_purchase_button: "+ Új vásárolt termék",
      purchase_name_label: "Termék",
      purchase_name_placeholder: "pl. akkumulátor",
      purchase_price_label: "Egységár (RON/db)",
      purchase_qty_label: "Darabszám",
      total_materials_label: "Anyagok összesen",
      total_purchases_label: "Levonás (vásárolt termékek)",
      total_label: "Fizetendő összesen",
      print_button: "🖨️ Elismervény nyomtatása (nem hivatalos)",
      reset_button: "Új kliens (mindent töröl)",
      reset_confirm: "Biztosan törlöd az összes tételt és új klienssel kezded?",
      print_empty_alert:
        "Nincs tétel a nyomtatáshoz. Adj hozzá legalább egy anyagot.",

      settings_login_title: "Beállítások",
      settings_login_subtitle: "Árlista szerkesztése",
      settings_header_title: "Árlista beállítások",
      back_to_calc: "Vissza a kalkulátorhoz",
      settings_desc_html:
        "Amit itt módosítasz, azt minden eszközön (telefonon, gépen, tableten) automatikusan látni fogjátok, külön beállítás nélkül. Az árlista <strong>megnézése</strong> bárhonnan működik, jelszó és egyéb beállítás nélkül. A módosítások <strong>elmentéséhez</strong> viszont egyszer be kell állítanod egy hozzáférési kulcsot — ezt lent, lépésről lépésre megtalálod. Mentés után néhány percen belül mindenhol az új árak jelennek meg.",
      materials_header_name: "Anyag megnevezése (RO)",
      materials_header_name_hu: "Magyar név (opcionális)",
      materials_header_price: "Egységár (RON/kg)",
      materials_header_price_clean: "Extra ár (opcionális, RON/kg)",
      add_material_button: "+ Új anyag",
      refresh_button: "🔄 Legfrissebb betöltése",
      reset_defaults_button: "Alapértelmezett árak betöltése",
      reset_defaults_confirm:
        'Az alapértelmezett árlistát töltöm be a szerkesztőbe. A mentetlen módosítások elvesznek. A tényleges mentéshez utána még a "Mentés GitHub-ra" gombra is kattintanod kell. Folytatod?',
      reset_defaults_done:
        'Alapértelmezett árak betöltve a szerkesztőbe — mentéshez kattints a "Mentés GitHub-ra" gombra.',
      github_token_title: "Hozzáférési kulcs a mentéshez",
      github_token_label: "Hozzáférési kulcs",
      remember_token_label: "Emlékezzen a kulcsra ezen az eszközön",
      token_hint_html:
        "Írd be ide fent a kódot, és ha bepipálod, hogy „Emlékezzen a kulcsra ezen az eszközön”, legközelebb ezen a gépen/telefonon nem kell újra beírnod.",
      save_button_github: "Mentés GitHub-ra",
      status_min_one: "Legalább egy érvényes anyagot adj meg (név + ár).",
      status_need_token:
        "A mentéshez előbb add meg lent a hozzáférési kulcsot.",
      status_saving: "Mentés…",
      status_saved:
        "Mentve. Néhány percen belül minden eszközön frissül az árlista.",
      status_fetch_fail:
        "Nem sikerült elérni a legfrissebb árlistát az internetről — egyelőre az alapértelmezett árak jelennek meg.",
      status_refreshed: "Legfrissebb árlista betöltve.",

      receipt_subtitle: "Mérlegelési és átvételi jegyzet",
      receipt_disclaimer:
        "Ez NEM hivatalos bizonylat, kizárólag tájékoztató jellegű, belső elismervény az átvett anyagról és a kifizetett összegről. Hivatalos számla vagy bizonylat igénylése esetén kérje a cég hivatalos kiállítású dokumentumát.",
      receipt_id_label: "Azonosító:",
      receipt_date_label: "Dátum:",
      receipt_name_label: "Név:",
      receipt_cnp_label: "CNP:",
      receipt_make_label: "Autó márkája:",
      receipt_plate_label: "Rendszám:",
      receipt_col_material: "Anyag",
      receipt_col_measure: "Mérés",
      receipt_col_net: "Nettó súly",
      receipt_col_price: "Egységár",
      receipt_col_sum: "Összeg",
      receipt_purchases_title: "Vásárolt termékek",
      receipt_total_label: "Fizetett összeg:",
      receipt_fondmediu_note: '(az árban benne van a -10% "fond mediu")',
      receipt_sig_company: "Cég aláírása",
      receipt_sig_provider: "Anyagot beszolgáltató aláírása",
      receipt_mode_scale: "Mérlegelve",
      receipt_mode_loaded_prefix: "Tele",
      receipt_mode_empty_word: "üres",
    },

    ro: {
      login_password_placeholder: "Parolă",
      login_button: "Autentificare",
      login_loading: "Se încarcă…",
      login_error: "Parolă greșită.",

      calc_login_title: "Calculator recepție materiale",
      calc_login_subtitle: "Instrument intern pentru evidența achizițiilor",
      calc_header_title: "Calculator recepție materiale",
      settings_link: "Setări",
      logout_button: "Ieșire",
      materials_warning:
        "Nu s-a putut accesa cea mai recentă listă de prețuri de pe internet — se afișează prețurile implicite până la restabilirea conexiunii.",
      person_card_title: "Datele persoanei",
      person_name_label: "Nume",
      person_name_placeholder: "ex. Ionescu Ion",
      person_cnp_label: "CNP",
      person_cnp_placeholder: "1234567890123",
      vehicle_card_title: "Datele vehiculului",
      vehicle_make_label: "Marca autovehiculului",
      vehicle_make_placeholder: "ex. Volkswagen",
      vehicle_plate_label: "Număr de înmatriculare",
      vehicle_plate_placeholder: "ex. CJ01ABC",
      field_material: "Material",
      field_measure_type: "Tip de măsurare",
      mode_scale_option: "Cântărire (cantitate mică)",
      mode_vehicle_option: "Cântărire vehicul (cantitate mare)",
      field_price_type: "Tip de preț",
      price_standard_option: "Standard",
      price_extra_option: "Extra",
      remove_item_title: "Șterge articolul",
      field_weight_scale: "Greutate (kg)",
      field_weight_loaded: "Greutate încărcat (kg) – vehicul + material",
      field_weight_empty: "Greutate gol (kg) – vehicul gol",
      item_net_label: "Greutate netă:",
      item_price_label: "Preț unitar:",
      item_subtotal_label: "Subtotal:",
      empty_hint: "Încă nu există niciun articol. Adaugă unul mai jos.",
      add_item_button: "+ Articol nou",
      purchases_section_title: "Produse cumpărate (se scad din sumă)",
      add_purchase_button: "+ Produs cumpărat nou",
      purchase_name_label: "Produs",
      purchase_name_placeholder: "ex. baterie auto",
      purchase_price_label: "Preț unitar (RON/buc)",
      purchase_qty_label: "Cantitate (buc)",
      total_materials_label: "Total materiale",
      total_purchases_label: "Deducere (produse cumpărate)",
      total_label: "Total de plată",
      print_button: "🖨️ Tipărire chitanță (neoficială)",
      reset_button: "Client nou (șterge tot)",
      reset_confirm:
        "Sigur ștergi toate articolele și începi cu un client nou?",
      print_empty_alert:
        "Nu există niciun articol de tipărit. Adaugă cel puțin un material.",

      settings_login_title: "Setări",
      settings_login_subtitle: "Editare listă de prețuri",
      settings_header_title: "Setări listă de prețuri",
      back_to_calc: "Înapoi la calculator",
      settings_desc_html:
        "Tot ce modifici aici va fi vizibil automat pe orice dispozitiv (telefon, calculator, tabletă), fără nicio setare suplimentară. <strong>Vizualizarea</strong> listei de prețuri funcționează oricând, fără parolă sau alte setări. Pentru a <strong>salva</strong> modificările, trebuie însă să configurezi o singură dată o cheie de acces — o găsești mai jos, explicată pas cu pas. După salvare, prețurile noi apar peste tot în câteva minute.",
      materials_header_name: "Denumire material (RO)",
      materials_header_name_hu: "Nume în maghiară (opțional)",
      materials_header_price: "Preț unitar (RON/kg)",
      materials_header_price_clean: "Preț extra (opțional, RON/kg)",
      add_material_button: "+ Material nou",
      refresh_button: "🔄 Încarcă cel mai recent",
      reset_defaults_button: "Încarcă prețurile implicite",
      reset_defaults_confirm:
        'Se încarcă lista de prețuri implicită în editor. Modificările nesalvate se pierd. Pentru salvarea efectivă trebuie apoi să apeși și butonul "Salvare pe GitHub". Continui?',
      reset_defaults_done:
        'Prețurile implicite au fost încărcate în editor — pentru salvare apasă butonul "Salvare pe GitHub".',
      github_token_title: "Cheia de acces pentru salvare",
      github_token_label: "Cheie de acces",
      remember_token_label: "Reține cheia pe acest dispozitiv",
      token_hint_html:
        "Intra codul mai sus , iar dacă bifezi „Reține cheia pe acest dispozitiv”, data viitoare nu va trebui să o mai introduci pe acest telefon/calculator.",
      save_button_github: "Salvare pe GitHub",
      status_min_one: "Adaugă cel puțin un material valid (nume + preț).",
      status_need_token: "Pentru salvare, introdu mai jos cheia de acces.",
      status_saving: "Se salvează…",
      status_saved:
        "Salvat. În câteva minute lista de prețuri se actualizează pe toate dispozitivele.",
      status_fetch_fail:
        "Nu s-a putut accesa cea mai recentă listă de prețuri — deocamdată se afișează prețurile implicite.",
      status_refreshed: "Cea mai recentă listă de prețuri a fost încărcată.",

      receipt_subtitle: "Nota de recepție și cantitate",
      receipt_disclaimer:
        "Aceasta NU este o chitanță oficială, este doar o dovadă internă, informativă, privind materialul recepționat și suma plătită. Pentru o factură sau un document oficial, solicitați documentul emis oficial de companie.",
      receipt_id_label: "Identificator:",
      receipt_date_label: "Data:",
      receipt_name_label: "Nume:",
      receipt_cnp_label: "CNP:",
      receipt_make_label: "Marca autovehiculului:",
      receipt_plate_label: "Număr de înmatriculare:",
      receipt_col_material: "Material",
      receipt_col_measure: "Măsurare",
      receipt_col_net: "Greutate netă",
      receipt_col_price: "Preț unitar",
      receipt_col_sum: "Sumă",
      receipt_purchases_title: "Produse cumpărate",
      receipt_total_label: "Sumă plătită:",
      receipt_fondmediu_note: "(prețul include deducerea de -10% fond mediu)",
      receipt_sig_company: "Semnătura companiei",
      receipt_sig_provider: "Semnătura furnizorului de material",
      receipt_mode_scale: "Cântărit",
      receipt_mode_loaded_prefix: "Încărcat",
      receipt_mode_empty_word: "gol",
    },
  };

  function getLang() {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === "hu" || saved === "ro" ? saved : DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem(LANG_STORAGE_KEY, lang === "ro" ? "ro" : "hu");
  }

  function t(key) {
    const lang = getLang();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
      return dict[key];
    }
    const fallback = TRANSLATIONS[DEFAULT_LANG];
    return fallback && Object.prototype.hasOwnProperty.call(fallback, key)
      ? fallback[key]
      : key;
  }

  function applyTranslations() {
    const lang = getLang();
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.title = t(el.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle(
        "active",
        btn.getAttribute("data-lang-btn") === lang,
      );
    });
  }

  function initLangSwitcher(onChange) {
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang-btn"));
        applyTranslations();
        if (typeof onChange === "function") onChange();
      });
    });
    applyTranslations();
  }

  return {
    checkPassword: checkPassword,
    DEFAULT_MATERIALS: DEFAULT_MATERIALS,
    fetchMaterials: fetchMaterials,
    saveMaterialsToGitHub: saveMaterialsToGitHub,
    formatRON: formatRON,
    formatKg: formatKg,
    getLang: getLang,
    setLang: setLang,
    t: t,
    applyTranslations: applyTranslations,
    initLangSwitcher: initLangSwitcher,
    displayMaterialName: displayMaterialName,
    materialHasExtraPrice: materialHasExtraPrice,
    getEffectivePrice: getEffectivePrice,
  };
})();
