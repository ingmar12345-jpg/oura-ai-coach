"use strict";
(() => {
  const { useState, useEffect, useMemo, useRef } = React;
  const CATEGORIES = [
    "Piimatooted",
    "Liha ja kala",
    "Puu- ja k\xF6\xF6givili",
    "Leib ja pagaritooted",
    "Kuivained ja s\xE4ilivad",
    "K\xFClmutatud",
    "Joogid",
    "Maiustused ja sn\xE4kid",
    "Majapidamine",
    "H\xFCgieen ja ilu",
    "Lemmikloom",
    "Muu"
  ];
  const PRIOR = {
    Piimatooted: 5,
    "Liha ja kala": 7,
    "Puu- ja k\xF6\xF6givili": 5,
    "Leib ja pagaritooted": 4,
    "Kuivained ja s\xE4ilivad": 21,
    K\u00FClmutatud: 20,
    Joogid: 7,
    "Maiustused ja sn\xE4kid": 10,
    Majapidamine: 35,
    "H\xFCgieen ja ilu": 45,
    Lemmikloom: 20,
    Muu: 14
  };
  const CAT_COLOR = {
    Piimatooted: "#3B9AE1",
    "Liha ja kala": "#E5484D",
    "Puu- ja k\xF6\xF6givili": "#3FBF63",
    "Leib ja pagaritooted": "#E9930B",
    "Kuivained ja s\xE4ilivad": "#9A8259",
    K\u00FClmutatud: "#4FC3D9",
    Joogid: "#8B5CF6",
    "Maiustused ja sn\xE4kid": "#EC4899",
    Majapidamine: "#6B7280",
    "H\xFCgieen ja ilu": "#A855F7",
    Lemmikloom: "#C08A2A",
    Muu: "#475569"
  };
  const emptyData = {
    receipts: [],
    manualPurchases: [],
    stillHave: {},
    extras: [],
    hidden: {},
    cart: {},
    settings: { mode: "daily", days: [], household: 2, store: "" },
    mealPlan: {},
    myRecipes: [],
    want: {}
  };
  const CATEGORY_ORDER = [
    "Puu- ja k\xF6\xF6givili",
    "Leib ja pagaritooted",
    "Liha ja kala",
    "Piimatooted",
    "K\xFClmutatud",
    "Kuivained ja s\xE4ilivad",
    "Joogid",
    "Maiustused ja sn\xE4kid",
    "Majapidamine",
    "H\xFCgieen ja ilu",
    "Lemmikloom",
    "Muu"
  ];
  const COMMON = [
    ["Piim", "Piimatooted"],
    ["Juust", "Piimatooted"],
    ["V\xF5i", "Piimatooted"],
    ["Hapukoor", "Piimatooted"],
    ["Jogurt", "Piimatooted"],
    ["Munad", "Piimatooted"],
    ["Hakkliha", "Liha ja kala"],
    ["Kanafilee", "Liha ja kala"],
    ["Vorst", "Liha ja kala"],
    ["Tomat", "Puu- ja k\xF6\xF6givili"],
    ["Kurk", "Puu- ja k\xF6\xF6givili"],
    ["Sibul", "Puu- ja k\xF6\xF6givili"],
    ["Kartul", "Puu- ja k\xF6\xF6givili"],
    ["Banaan", "Puu- ja k\xF6\xF6givili"],
    ["\xD5un", "Puu- ja k\xF6\xF6givili"],
    ["Leib", "Leib ja pagaritooted"],
    ["Sai", "Leib ja pagaritooted"],
    ["Pasta", "Kuivained ja s\xE4ilivad"],
    ["Riis", "Kuivained ja s\xE4ilivad"],
    ["Kohv", "Kuivained ja s\xE4ilivad"],
    ["Suhkur", "Kuivained ja s\xE4ilivad"],
    ["Mahl", "Joogid"],
    ["Mineraalvesi", "Joogid"],
    ["WC-paber", "Majapidamine"],
    ["N\xF5udepesuvahend", "Majapidamine"],
    ["Pesupulber", "Majapidamine"],
    ["Pr\xFCgikotid", "Majapidamine"],
    ["Hambapasta", "H\xFCgieen ja ilu"],
    ["\u0160ampoon", "H\xFCgieen ja ilu"],
    ["Seep", "H\xFCgieen ja ilu"]
  ];
  const WEEKDAYS = [
    { n: 1, short: "E", when: "esmasp\xE4eval" },
    { n: 2, short: "T", when: "teisip\xE4eval" },
    { n: 3, short: "K", when: "kolmap\xE4eval" },
    { n: 4, short: "N", when: "neljap\xE4eval" },
    { n: 5, short: "R", when: "reedel" },
    { n: 6, short: "L", when: "laup\xE4eval" },
    { n: 0, short: "P", when: "p\xFChap\xE4eval" }
  ];
  function nextShop(settings) {
    const s = settings || { mode: "daily", days: [] };
    if (s.mode === "daily" || !s.days?.length) return { days: 0, label: "t\xE4na" };
    const now = /* @__PURE__ */ new Date();
    for (let i = 0; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      if (s.days.includes(d.getDay())) {
        const when = WEEKDAYS.find((w) => w.n === d.getDay())?.when || "";
        return { days: i, label: i === 0 ? "t\xE4na" : i === 1 ? "homme" : when };
      }
    }
    return { days: 0, label: "t\xE4na" };
  }
  const key = (n) => (n || "").toLowerCase().trim().replace(/\s+/g, " ");
  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const today = () => localISO(/* @__PURE__ */ new Date());
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + "\u20AC";
  const uid = () => Math.random().toString(36).slice(2, 10);
  const fmtDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${Number(day)}.${Number(m)}.${y}`;
  };
  const daysAgo = (n) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - n);
    return localISO(d);
  };
  const UNITS = ["g", "kg", "ml", "l", "tk", "pakk", "spl", "tl"];
  const UNIT_BASE = { kg: ["g", 1e3], l: ["ml", 1e3] };
  const toBase = (a) => UNIT_BASE[a.unit] ? { qty: a.qty * UNIT_BASE[a.unit][1], unit: UNIT_BASE[a.unit][0] } : { ...a };
  const parseQty = (v) => Number(String(v ?? "").replace(",", ".")) || 0;
  const roundQty = (qty, unit) => {
    if (unit === "tk" || unit === "pakk") return Math.max(1, Math.ceil(qty - 1e-9));
    if (unit === "g" || unit === "ml")
      return qty < 10 ? Math.max(1, Math.round(qty)) : qty < 100 ? Math.round(qty / 5) * 5 : Math.round(qty / 10) * 10;
    if (unit === "spl" || unit === "tl") return Math.max(0.5, Math.round(qty * 2) / 2);
    return Math.max(0.05, Math.round(qty * 100) / 100);
  };
  const fmtNum = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
  const fmtAmount = (a) => {
    const b = toBase(a);
    if (b.unit === "g" && b.qty >= 1e3) return `${fmtNum(b.qty / 1e3)} kg`;
    if (b.unit === "ml" && b.qty >= 1e3) return `${fmtNum(b.qty / 1e3)} l`;
    return `${fmtNum(b.qty)} ${b.unit}`;
  };
  const fmtAmounts = (list) => (list || []).map(fmtAmount).join(" + ");
  const mergeAmounts = (list, add) => {
    const out = (list || []).map((a) => ({ ...a }));
    const b = toBase(add);
    const hit = out.find((a) => a.unit === b.unit);
    if (hit) hit.qty += b.qty;
    else out.push(b);
    return out;
  };
  const scaleAmount = (item, factor) => parseQty(item.qty) > 0 ? { qty: roundQty(parseQty(item.qty) * factor, item.unit), unit: item.unit } : null;
  const parseListInput = (t) => {
    const U = "(tk|pakk|kg|g|l|ml)";
    let m = t.match(new RegExp(`^(.+?)[\\s,]+(\\d+(?:[.,]\\d+)?)\\s*${U}?\\.?$`, "i"));
    let name, n, unit;
    if (m) [, name, n, unit] = m;
    else if (m = t.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(?:x|\xD7)?\\s*${U}?\\s+(.+)$`, "i")))
      [, n, unit, name] = m;
    const qty = parseQty(n);
    if (!m || !qty || !name.trim()) return { name: t };
    unit = (unit || "tk").toLowerCase();
    return unit === "tk" || unit === "pakk" ? { name: name.trim(), count: Math.max(1, Math.round(qty)) } : { name: name.trim(), amount: { qty, unit } };
  };
  const relDays = (n) => n === 0 ? "t\xE4na" : n === 1 ? "eile" : `${n} p\xE4eva tagasi`;
  function buildProducts(data) {
    const map = /* @__PURE__ */ new Map();
    const push = (name, category, date, qty, unitPrice, total, store, manual, src, unit) => {
      const k = key(name);
      if (!k) return;
      if (!map.has(k))
        map.set(k, { k, name: name.trim(), category: category || "Muu", purchases: [] });
      const p = map.get(k);
      if (category && category !== "Muu") p.category = category;
      p.purchases.push({ date, qty: qty || 1, unit: unit || "tk", unitPrice, total, store, manual, src });
    };
    data.receipts.forEach(
      (r) => r.lines.forEach(
        (l, idx) => push(l.name, l.category, r.date, l.qty, l.unitPrice, l.total, r.store, false, {
          type: "receipt",
          rid: r.id,
          idx
        }, l.unit)
      )
    );
    data.manualPurchases.forEach(
      (m) => push(m.name, m.category, m.date, m.qty, null, 0, null, true, {
        type: "manual",
        id: m.id
      })
    );
    const now = today();
    const lookahead = nextShop(data.settings).days;
    return Array.from(map.values()).map((p) => {
      p.purchases.sort((a, b) => a.date.localeCompare(b.date));
      const prior = PRIOR[p.category] ?? 14;
      const last = p.purchases[p.purchases.length - 1];
      const perUnit = [];
      for (let i = 1; i < p.purchases.length; i++) {
        const gap = daysBetween(p.purchases[i - 1].date, p.purchases[i].date);
        const q = Math.max(p.purchases[i - 1].qty || 1, 0.25);
        if (gap > 0) perUnit.push(gap / q);
      }
      const sorted = perUnit.slice().sort((a, b) => a - b);
      const median = sorted.length ? sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : prior;
      const kept = sorted.filter((x) => x <= median * 3);
      const n = kept.length;
      const mean = n ? kept.reduce((a, b) => a + b, 0) / n : prior;
      const shrunk = (n * mean + 2 * prior) / (n + 2);
      let est = Math.min(Math.max(shrunk * Math.max(last.qty || 1, 1), 2), 120);
      const sh = data.stillHave[p.k];
      let from = last.date;
      if (sh && sh > last.date) {
        est = Math.max(est, daysBetween(last.date, sh) + prior * 0.4);
        from = sh;
      }
      const daysSince = Math.max(daysBetween(from, now), 0);
      const daysSincePurchase = Math.max(daysBetween(last.date, now), 0);
      const bag = p.k === BAG_KEY;
      const recent = p.purchases.slice(-5);
      const qs = recent.map((x) => x.qty || 1).sort((a, b) => a - b);
      const medQty = qs.length % 2 ? qs[(qs.length - 1) / 2] : (qs[qs.length / 2 - 1] + qs[qs.length / 2]) / 2;
      const lastUnit = recent[recent.length - 1].unit || "tk";
      const countable = lastUnit === "tk" || lastUnit === "pakk";
      const usual = countable ? { count: Math.max(1, Math.round(medQty)), unit: lastUnit } : { amount: { qty: Math.round(medQty * 100) / 100, unit: lastUnit } };
      const progress = bag ? 0 : est > 0 ? (daysSince + lookahead) / est : 0;
      const status = progress >= 1 ? "otsas" : progress >= 0.7 ? "varsti" : "olemas";
      const priced = p.purchases.filter((x) => x.unitPrice > 0);
      return {
        ...p,
        bag,
        usual,
        units: p.purchases.reduce((a, b) => a + (b.qty || 0), 0),
        est,
        progress,
        status,
        daysSince,
        daysSincePurchase,
        daysLeft: Math.max(Math.round(est - daysSince), 0),
        lastDate: last.date,
        count: p.purchases.length,
        spend: p.purchases.reduce((a, b) => a + (b.total || 0), 0),
        firstPrice: priced.length ? priced[0].unitPrice : null,
        lastPrice: priced.length ? priced[priced.length - 1].unitPrice : null,
        confident: n >= 2,
        hidden: !!data.hidden[p.k]
      };
    }).sort((a, b) => b.progress - a.progress);
  }
  function renameProduct(data, oldKey, newName) {
    const name = (newName || "").trim();
    const nk = key(name);
    if (!nk) return data;
    const stillHave = { ...data.stillHave };
    const hidden = { ...data.hidden };
    if (stillHave[oldKey]) {
      stillHave[nk] = stillHave[oldKey];
      delete stillHave[oldKey];
    }
    if (hidden[oldKey]) {
      hidden[nk] = true;
      delete hidden[oldKey];
    }
    return {
      ...data,
      receipts: data.receipts.map((r) => ({
        ...r,
        lines: r.lines.map((l) => key(l.name) === oldKey ? { ...l, name } : l)
      })),
      manualPurchases: data.manualPurchases.map(
        (m) => key(m.name) === oldKey ? { ...m, name } : m
      ),
      stillHave,
      hidden
    };
  }
  function setProductCategory(data, k, category) {
    return {
      ...data,
      receipts: data.receipts.map((r) => ({
        ...r,
        lines: r.lines.map((l) => key(l.name) === k ? { ...l, category } : l)
      })),
      manualPurchases: data.manualPurchases.map(
        (m) => key(m.name) === k ? { ...m, category } : m
      )
    };
  }
  function deleteProduct(data, k) {
    const stillHave = { ...data.stillHave };
    const hidden = { ...data.hidden };
    delete stillHave[k];
    delete hidden[k];
    return {
      ...data,
      receipts: data.receipts.map((r) => ({ ...r, lines: r.lines.filter((l) => key(l.name) !== k) })).filter((r) => r.lines.length),
      manualPurchases: data.manualPurchases.filter((m) => key(m.name) !== k),
      stillHave,
      hidden
    };
  }
  function deletePurchase(data, src) {
    if (!src) return data;
    if (src.type === "manual")
      return { ...data, manualPurchases: data.manualPurchases.filter((m) => m.id !== src.id) };
    return {
      ...data,
      receipts: data.receipts.map(
        (r) => r.id === src.rid ? { ...r, lines: r.lines.filter((_, i) => i !== src.idx) } : r
      ).filter((r) => r.lines.length)
    };
  }
  const saveReceipt = (data, receipt) => ({
    ...data,
    receipts: data.receipts.map((r) => r.id === receipt.id ? receipt : r)
  });
  const removeReceipt = (data, id) => ({
    ...data,
    receipts: data.receipts.filter((r) => r.id !== id)
  });
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Pilti ei \xF5nnestunud lugeda"));
      reader.readAsDataURL(file);
    });
  }
  async function callAI(prompt, opts) {
    opts = opts || {};
    let image;
    if (opts.images) {
      image = await fileToDataURL(opts.images);
    }
    let resp;
    try {
      resp = await fetch("/.netlify/functions/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, image })
      });
    } catch (e) {
      const err = new Error("Ei saanud serveriga \xFChendust");
      err.code = "network_error";
      throw err;
    }
    let json;
    try {
      json = await resp.json();
    } catch (e) {
      const err = new Error("Ootamatu vastus serverist");
      err.code = "invalid_json";
      throw err;
    }
    if (!json || json.ok !== true) {
      const err = new Error(json && json.message || "AI p\xE4ring eba\xF5nnestus");
      err.code = json && json.code || "refused";
      throw err;
    }
    return json.data;
  }
  function friendlyError(e) {
    const code = e && e.code;
    switch (code) {
      case "not_configured":
        return "AI-funktsioonid ei ole veel seadistatud (API-v\xF5ti puudub serveris).";
      case "network_error":
        return "Ei saanud serveriga \xFChendust. Kontrolli interneti\xFChendust ja proovi uuesti.";
      case "not_granted":
      case "sampling_disabled":
      case "not_declared":
      case "capability_disabled":
      case "capability_removed":
        return "AI-funktsioonid ei ole praegu selles vaates saadaval.";
      case "images_unavailable":
        return "See vaade ei luba pilte saata.";
      case "image_rejected":
        return "Pilti ei \xF5nnestunud lugeda. Pildista otse \xFClevalt, hea valgusega, nii et kogu t\u0161ekk mahub kaadrisse.";
      case "rate_limited":
        return "Liiga palju p\xE4ringuid korraga. Proovi natukese aja p\xE4rast uuesti.";
      case "session_expired":
        return "Sessioon aegus \u2014 laadi leht uuesti.";
      case "refused":
        return "AI ei saanud selle p\xE4ringuga hakkama. Proovi teistsuguse pildi v\xF5i s\xF5nastusega.";
      case "cancelled":
        return "Katkestatud.";
      case "invalid_json":
      case "empty_completion":
        return "Vastus tuli ootamatus vormingus. Proovi uuesti.";
      case "prompt_too_large":
        return "P\xE4ring oli liiga suur. Proovi v\xE4hemate toodetega korraga.";
      default:
        return e && e.message || "Tundmatu viga";
    }
  }
  const STAPLES = [
    "sool",
    "pipar",
    "\xF5li",
    "vesi",
    "suhkur",
    "maitse",
    "v\xFCrts",
    "loorber"
  ];
  const BAG_NAME = "Poekott";
  const BAG_KEY = "poekott";
  const BAG_WORDS = ["poekot", "kilekot", "paberkot", "ostukot", "kandekot", "riidekot", "riidest kot", "sussikot"];
  const NOT_BAG_WORDS = ["pr\xFCgi", "toidu", "k\xFClmut", "k\xFCpset", "rull", "zip", "tolmu"];
  const isBagLine = (name) => {
    const n = key(name);
    if (!n || NOT_BAG_WORDS.some((w) => n.includes(w))) return false;
    return n === "kott" || n === "kotike" || BAG_WORDS.some((w) => n.includes(w));
  };
  const asBag = (l) => isBagLine(l.name) ? { ...l, name: BAG_NAME, category: "Muu" } : l;
  const isStaple = (name) => {
    const n = (name || "").toLowerCase();
    return STAPLES.some((w) => n.includes(w));
  };
  async function readReceipt(file, knownNames) {
    const prompt = `Loe see Eesti poe kassat\u0161ekk pildilt.

Tagasta AINULT JSON, ilma selgituste ja koodiplokkideta, t\xE4pselt sellises kujus:
{"store": "<poe nimi>", "date": "<AAAA-KK-PP>", "total": <arv>, "lines": [
  {"name": "<l\xFChike eestikeelne tootenimi, ilma br\xE4ndita kui br\xE4nd pole oluline>", "category": "<\xFCks kategooriatest>", "qty": <arv>, "unit": "<tk|kg|l>", "unitPrice": <arv>, "total": <arv>, "conf": <0..1>}
]}

Reeglid:
- kategooria peab olema RANGELT \xFCks j\xE4rgnevast loetelust: ${CATEGORIES.join(", ")}
- kui sisuliselt sama toode on juba tuntud toodete seas, kasuta t\xE4pselt sama nime. Tuntud tooted: ${knownNames.slice(0, 120).join(", ") || "(pole veel)"}
- j\xE4ta t\xE4iesti v\xE4lja: pandipakend, allahindlusread, boonuspunktid, kokku-read
- kotid, mida pood m\xFC\xFCb ostude kaasav\xF5tmiseks (nt "Kilekott", "Ostukott", "Paberkott",
  "Kandekott", "Riidest kott", "\xD5huke kilekott" jms) v\xF5ta ALATI sisse nimega t\xE4pselt "${BAG_NAME}"
  ja kategooriaga "Muu" (toidu-, pr\xFCgi- ja k\xFClmutuskotid on tavalised tooted, mitte poekotid)
- kui kuup\xE4eva ei ole n\xE4ha, kasuta: ${today()}
- k\xF5ik hinnad eurodes, punkt k\xFCmnendkohana
- conf n\xE4itab, kui h\xE4sti rida loetav oli`;
    const parsed = await callAI(prompt, { images: file });
    const rawLines = Array.isArray(parsed && parsed.lines) ? parsed.lines : [];
    const allLines = rawLines.filter((l) => l && l.name).map((l) => {
      const qty = Number(l.qty) || 1;
      const unitPrice = Number(l.unitPrice) || 0;
      return asBag({
        id: uid(),
        name: String(l.name).trim(),
        category: CATEGORIES.includes(l.category) ? l.category : "Muu",
        qty,
        unit: l.unit || "tk",
        unitPrice,
        total: Number(l.total) || unitPrice * qty,
        conf: Number(l.conf) || 0.8
      });
    });
    const lines = [];
    allLines.forEach((l) => {
      const bag = l.name === BAG_NAME && lines.find((m) => m.name === BAG_NAME);
      if (!bag) return lines.push(l);
      bag.qty += l.qty;
      bag.total = Math.round((bag.total + l.total) * 100) / 100;
      bag.unitPrice = Math.round(bag.total / bag.qty * 100) / 100;
      bag.conf = Math.min(bag.conf, l.conf);
    });
    return {
      store: typeof (parsed && parsed.store) === "string" ? parsed.store : "",
      date: /^\d{4}-\d{2}-\d{2}$/.test(parsed && parsed.date) ? parsed.date : today(),
      total: Number(parsed && parsed.total) || 0,
      lines
    };
  }
  async function fetchRecipes(names, household) {
    const prompt = `Kodus on praegu t\xF5en\xE4oliselt olemas: ${names.join(", ")}.

Paku 2 lihtsat kodust rooga ${household} inimesele, mis kasutavad peamiselt neid koostisosi. Eelda, et kodus on ka sool, pipar, \xF5li ja tavalised maitseained.

Tagasta AINULT JSON, ilma selgituste ja koodiplokkideta \u2014 massiiv kahest objektist t\xE4pselt sellises kujus:
[{"name": "<roa nimi>", "minutes": <valmimisaeg minutites>, "blurb": "<\xFCks lause, mis roog see on>",
  "macros": {"weight": <roa kogukaal grammides valmiskujul>, "kcal": <kcal 100 g kohta>, "p": <valk g 100 g kohta>, "f": <rasv g 100 g kohta>, "c": <s\xFCsivesikud g 100 g kohta>},
  "items": [{"name": "<koostisosa>", "amount": "<kogus ${household} inimesele>"}],
  "steps": ["<\xFCks l\xFChike valmistamise samm>"]}]

Iga retsepti kohta 4-6 koostisosa ja 3-4 sammu. Kirjuta eesti keeles.`;
    const list = await callAI(prompt);
    if (!Array.isArray(list) || !list.length) {
      const err = new Error("Vastus tuli ootamatus vormingus");
      err.code = "invalid_json";
      throw err;
    }
    return list.filter((r) => r && r.name && Array.isArray(r.items) && Array.isArray(r.steps) && r.items.length && r.steps.length).map((r) => ({
      id: uid(),
      name: String(r.name),
      minutes: Number(r.minutes) || null,
      blurb: r.blurb ? String(r.blurb) : "",
      items: r.items.map((i) => ({ name: String(i && i.name || ""), amount: String(i && i.amount || "") })),
      steps: r.steps.map((s) => String(s)),
      macros: r.macros && typeof r.macros === "object" ? {
        per100: true,
        weight: Math.round(Number(r.macros.weight) || 0),
        kcal: Math.round(Number(r.macros.kcal) || 0),
        p: Number(r.macros.p) || 0,
        f: Number(r.macros.f) || 0,
        c: Number(r.macros.c) || 0
      } : null
    }));
  }
  const normUnit = (qty, unit) => {
    const u = String(unit || "").toLowerCase().trim();
    if (u === "dl") return { qty: qty * 100, unit: "ml" };
    if (u === "cl") return { qty: qty * 10, unit: "ml" };
    return { qty, unit: UNITS.includes(u) ? u : "tk" };
  };
  async function fetchWishRecipe(wish, people, homeNames) {
    const prompt = `Kasutaja soovib s\xFC\xFCa: "${wish}".
Koosta sellest \xFCks lihtne kodune retsept ${people} inimesele.
Kodus on t\xF5en\xE4oliselt olemas: ${homeNames.join(", ") || "(teadmata)"}. Kui m\xF5ni neist sobib retsepti, kasuta koostisosa nimeks t\xE4pselt sama nime.

Tagasta AINULT JSON, ilma selgituste ja koodiplokkideta, t\xE4pselt sellises kujus:
{"name": "<roa nimi>", "minutes": <valmimisaeg minutites>, "blurb": "<\xFCks lause, mis roog see on>",
 "items": [{"name": "<l\xFChike eestikeelne tootenimi nagu poes, nt Hakkliha, Sibul, Riis>", "qty": <kogus ${people} inimesele>, "unit": "<\xFCks j\xE4rgmistest: ${UNITS.join(", ")}>"}],
 "steps": ["<\xFCks l\xFChike konkreetne valmistamise samm>"]}

Reeglid:
- kogused on ${people} inimesele ja sellistes \xFChikutes, nagu poest osta (g, ml, tk, pakk)
- sool, pipar, \xF5li ja maitseained: qty 0 (maitse j\xE4rgi)
- 4-10 koostisosa ja 4-8 sammu, k\xF5ik eesti keeles`;
    const r = await callAI(prompt);
    const items = (Array.isArray(r && r.items) ? r.items : []).filter((i) => i && i.name).map((i) => ({ name: String(i.name).trim(), ...normUnit(Math.max(0, Number(i.qty) || 0), i.unit) }));
    if (!r || !r.name || !items.length) {
      const err = new Error("Vastus tuli ootamatus vormingus");
      err.code = "invalid_json";
      throw err;
    }
    return {
      id: uid(),
      name: String(r.name).trim(),
      serves: people,
      items,
      steps: (Array.isArray(r.steps) ? r.steps : []).map(String),
      blurb: r.blurb ? String(r.blurb) : "",
      minutes: Number(r.minutes) || null,
      ai: true,
      wish,
      createdAt: today()
    };
  }
  async function fetchRecipeDetail(r, household) {
    const prompt = `Roog: ${r.name}, ${household} inimesele.
Koostisosad: ${r.items.map((i) => `${i.name} ${i.amount}`).join(", ")}

Kirjuta p\xF5hjalik samm-sammuline valmistusjuhend algajale. Tagasta AINULT JSON, ilma selgituste ja koodiplokkideta:
{"steps": ["<\xFCks samm, konkreetne \u2014 nimeta temperatuur, aeg, pannit\xFC\xFCp, kuidas aru saada et valmis>"], "tips": ["<vihje v\xF5i levinud viga, mida v\xE4ltida>"]}

Kirjuta 6-9 sammu ja 2-3 vihjet. Eesti keeles.`;
    const out = await callAI(prompt);
    const steps = Array.isArray(out && out.steps) ? out.steps.map(String) : [];
    const tips = Array.isArray(out && out.tips) ? out.tips.map(String) : [];
    if (!steps.length) {
      const err = new Error("Vastus tuli ootamatus vormingus");
      err.code = "invalid_json";
      throw err;
    }
    return { steps, tips };
  }
  function MacroPanel({ m, household }) {
    const [mode, setMode] = useState("100");
    if (!m) return null;
    const legacy = !m.per100;
    const factor = legacy || !m.weight ? 1 : mode === "100" ? 1 : mode === "kogu" ? m.weight / 100 : m.weight / 100 / Math.max(household, 1);
    const v = (x) => {
      const r = x * factor;
      return r >= 100 ? Math.round(r) : Math.round(r * 10) / 10;
    };
    const items = [
      ["kcal", v(m.kcal), T.ink],
      ["valk", `${v(m.p)} g`, T.fresh],
      ["rasv", `${v(m.f)} g`, T.soon],
      ["s\xFCsivesikud", `${v(m.c)} g`, "#5B8CB8"]
    ];
    const modes = [
      ["100", "100 g"],
      ["kogu", "kogu roog"],
      ["portsjon", `1/${household}`]
    ];
    return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12
        }
      },
      /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 0 } }, "Toitumisalane teave"),
      !legacy && m.weight > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, modes.map(([id, label]) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: id,
          onClick: () => setMode(id),
          style: {
            border: "none",
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11.5,
            fontFamily: FONT,
            fontWeight: mode === id ? 600 : 400,
            cursor: "pointer",
            background: mode === id ? T.ink : tint(T.ink, 0.06),
            color: mode === id ? "#fff" : T.soft
          }
        },
        label
      )))
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, items.map(([label, value, color]) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: label,
        style: {
          flex: 1,
          background: tint(color, 0.09),
          borderRadius: 11,
          padding: "10px 4px",
          textAlign: "center"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color, fontWeight: 600, ...num } }, value),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: T.faint, marginTop: 2 } }, label)
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 11, lineHeight: 1.5 } }, legacy || !m.weight ? "\xDChe portsjoni kohta." : mode === "100" ? `Saja grammi kohta. Roog kaalub kokku umbes ${m.weight} g.` : mode === "kogu" ? `Kogu roa kohta, umbes ${m.weight} g.` : `Kui roog jaguneb ${household} v\xF5rdseks osaks. Kui pere s\xF6\xF6b erinevalt, on 100 g t\xE4psem alus.`));
  }
  const WIN = { 352: 138, 353: 154, 381: 142, 382: 158, 8217: 39, 8211: 45, 8212: 45 };
  const enc = (s) => Array.from(String(s)).map((ch) => {
    const c = ch.codePointAt(0);
    if (c < 256) return String.fromCharCode(c);
    if (WIN[c]) return String.fromCharCode(WIN[c]);
    return "?";
  }).join("");
  const esc = (s) => enc(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  function wrap(text, size, maxWidth) {
    const perChar = size * 0.5;
    const limit = Math.max(Math.floor(maxWidth / perChar), 12);
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((w) => {
      if (!line.length) line = w;
      else if ((line + " " + w).length <= limit) line += " " + w;
      else {
        lines.push(line);
        line = w;
      }
    });
    if (line) lines.push(line);
    return lines;
  }
  function recipePdf(r, household) {
    const W = 595.28;
    const H = 841.89;
    const M = 56;
    const maxW = W - M * 2;
    let y = H - M;
    let out = "";
    const text = (str, size, bold, color, indent = 0) => {
      out += `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${M + indent} ${y} Td (${esc(str)}) Tj ET
`;
    };
    const para = (str, size, bold, color, indent = 0, gap = 4) => {
      wrap(str, size, maxW - indent).forEach((ln) => {
        text(ln, size, bold, color, indent);
        y -= size * 1.42;
      });
      y -= gap;
    };
    const rule = () => {
      out += `0.88 0.89 0.87 RG 0.8 w ${M} ${y + 6} m ${W - M} ${y + 6} l S
`;
      y -= 10;
    };
    const INK = "0.08 0.11 0.09";
    const GREEN = "0.24 0.48 0.37";
    const GREY = "0.55 0.58 0.56";
    para(r.name, 23, true, INK, 0, 6);
    if (r.blurb) para(r.blurb, 11, false, GREY, 0, 4);
    para(
      `${household} portsjonit${r.minutes ? ` \xB7 ${r.minutes} minutit` : ""}`,
      10.5,
      false,
      GREEN,
      0,
      14
    );
    const m = r.macros;
    if (m) {
      rule();
      if (m.per100 && m.weight) {
        const k = m.weight / 100;
        para(
          `100 g kohta:  ${m.kcal} kcal  \xB7  valk ${m.p} g  \xB7  rasv ${m.f} g  \xB7  susivesikud ${m.c} g`,
          10.5,
          false,
          INK,
          0,
          3
        );
        para(
          `Kogu roog (u ${m.weight} g):  ${Math.round(m.kcal * k)} kcal  \xB7  valk ${Math.round(
            m.p * k
          )} g  \xB7  rasv ${Math.round(m.f * k)} g  \xB7  susivesikud ${Math.round(m.c * k)} g`,
          10.5,
          false,
          GREY,
          0,
          12
        );
      } else {
        para(
          `Portsjoni kohta:  ${m.kcal} kcal  \xB7  valk ${m.p} g  \xB7  rasv ${m.f} g  \xB7  susivesikud ${m.c} g`,
          10.5,
          false,
          GREY,
          0,
          12
        );
      }
    }
    rule();
    para("KOOSTISOSAD", 10, true, GREEN, 0, 10);
    r.items.forEach((i) => {
      const label = i.amount ? `${i.name}  \u2014  ${i.amount}` : i.name;
      out += `${GREEN} rg ${M + 2} ${y + 3} m ${M + 5.4} ${y + 3} l ${M + 5.4} ${y + 6.4} l ${M + 2} ${y + 6.4} l f
`;
      para(label, 11, false, INK, 14, 1);
    });
    y -= 8;
    rule();
    para("VALMISTAMINE", 10, true, GREEN, 0, 10);
    const steps = r.detail?.steps?.length ? r.detail.steps : r.steps;
    steps.forEach((s, i) => {
      text(`${i + 1}.`, 11, true, GREEN, 0);
      para(s, 11, false, INK, 20, 6);
    });
    if (r.detail?.tips?.length) {
      y -= 6;
      rule();
      para("HEA TEADA", 10, true, GREEN, 0, 10);
      r.detail.tips.forEach((t) => para(t, 10.5, false, GREY, 0, 5));
    }
    out += `BT /F1 8.5 Tf ${GREY} rg ${M} ${M - 16} Td (${esc("NeedMore")}) Tj ET
`;
    const objs = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${out.length} >>
stream
${out}
endstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [];
    objs.forEach((o, i) => {
      offsets.push(pdf.length);
      pdf += `${i + 1} 0 obj
${o}
endobj
`;
    });
    const xref = pdf.length;
    pdf += `xref
0 ${objs.length + 1}
0000000000 65535 f 
`;
    offsets.forEach((o) => {
      pdf += String(o).padStart(10, "0") + " 00000 n \n";
    });
    pdf += `trailer
<< /Size ${objs.length + 1} /Root 1 0 R >>
startxref
${xref}
%%EOF`;
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }
  function downloadRecipe(r, household) {
    const filename = `${r.name.replace(/[^\wäöüõÄÖÜÕ ]+/g, "").trim() || "retsept"}.pdf`;
    const url = URL.createObjectURL(recipePdf(r, household));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4e3);
  }
  const T = {
    bg: "#F4F6F9",
    surface: "#FFFFFF",
    raised: "#E9F0F7",
    ink: "#122234",
    soft: "#44535F",
    faint: "#8493A0",
    hair: "#E3E9F0",
    gold: "#123A63",
    fresh: "#4E9E3A",
    soon: "#E08A1E",
    out: "#D64545"
  };
  const FONT = "'DM Sans', ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const statusColor = (s) => s === "otsas" ? T.out : s === "varsti" ? T.soon : T.fresh;
  const tint = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`;
  };
  const mixHex = (a, b, t) => {
    const na = parseInt(a.slice(1), 16);
    const nb = parseInt(b.slice(1), 16);
    const k = Math.max(0, Math.min(1, t));
    const ch = (shift) => {
      const va = na >> shift & 255;
      const vb = nb >> shift & 255;
      return Math.round(va + (vb - va) * k);
    };
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  const progressColor = (progress) => {
    const p = Math.max(0, progress || 0);
    if (p <= 0.7) return mixHex(T.fresh, T.soon, p / 0.7);
    return mixHex(T.soon, T.out, (p - 0.7) / 0.3);
  };
  const tintAny = (color, a) => {
    if (color && color.startsWith("rgb(")) {
      return `rgba(${color.slice(4, -1)},${a})`;
    }
    return tint(color, a);
  };
  const num = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: "'tnum'" };
  const ICONS = {
    list: "M3 6h2l1.5 1.5L9 5M3 12h2l1.5 1.5L9 10M3 18h2l1.5 1.5L9 16M13 6h8M13 12h8M13 18h8",
    add: "M12 3a9 9 0 100 18 9 9 0 000-18M12 8v8M8 12h8",
    recipes: "M5 9h14v6a4 4 0 01-4 4H9a4 4 0 01-4-4zM5 11H3M19 11h2M9 5.5c0-1 1.5-1 1.5-2M13.5 5.5c0-1 1.5-1 1.5-2",
    stats: "M12 3a9 9 0 109 9h-9z M13.5 3.2A9 9 0 0120.8 10.5",
    products: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"
  };
  const CAT_ART = {
    Piimatooted: {
      bg: "#DCEDFA",
      parts: [
        ["M8 9.6L12 5.2l4 4.4V19a1.4 1.4 0 01-1.4 1.4H9.4A1.4 1.4 0 018 19z", "#F4FAFF"],
        ["M8 9.6L12 5.2l4 4.4z", "#B9DCF3"],
        ["M8 12.6h8v2.6H8z", "#3B9AE1"]
      ]
    },
    "Liha ja kala": {
      bg: "#FBE0E0",
      parts: [
        ["M16.6 12s-2.4 3.7-6.2 3.7S4.2 12 4.2 12s2.2-3.7 6.2-3.7S16.6 12 16.6 12z", "#E5484D"],
        ["M16.6 12l3.2-2.8v5.6z", "#C23237"],
        ["M9.2 10.8a.9.9 0 100 1.8.9.9 0 000-1.8z", "#FFFFFF"]
      ]
    },
    "Puu- ja k\xF6\xF6givili": {
      bg: "#DDF3E4",
      parts: [
        ["M12 8.6c-2.5-2.4-6.6-.9-6.6 3.6 0 3.6 2.7 7.3 4.5 7.3.9 0 1-.5 2.1-.5s1.3.5 2.1.5c1.8 0 4.5-3.7 4.5-7.3 0-4.5-4.1-6-6.6-3.6z", "#E5484D"],
        ["M12 8.6V6.2c0-1 .5-1.6 1.3-2", "#7A4B2A"],
        ["M12.4 6.4c1.2-1.6 3-2 4.2-1.8.2 1.4-.7 3-2.2 3.4-.9.2-1.6 0-2-.5z", "#3FBF63"]
      ]
    },
    "Leib ja pagaritooted": {
      bg: "#FBEEDA",
      parts: [
        ["M4.6 12.2c0-3.2 3.3-5.2 7.4-5.2s7.4 2 7.4 5.2v5.4a1.8 1.8 0 01-1.8 1.8H6.4a1.8 1.8 0 01-1.8-1.8z", "#D79A47"],
        ["M4.6 12.6c0-3 3.3-4.8 7.4-4.8s7.4 1.8 7.4 4.8c-2-1.2-4.6-1.8-7.4-1.8s-5.4.6-7.4 1.8z", "#EFBE79"],
        ["M8.6 13.4v4.4M12 13.2v4.6M15.4 13.4v4.4", null, "#B87A2E", 1.3]
      ]
    },
    "Kuivained ja s\xE4ilivad": {
      bg: "#EFEADC",
      parts: [
        ["M6.6 7.4h10.8v10.4a1.8 1.8 0 01-1.8 1.8H8.4a1.8 1.8 0 01-1.8-1.8z", "#C6B68C"],
        ["M6.6 7.4c0-1.5 2.4-2.6 5.4-2.6s5.4 1.1 5.4 2.6-2.4 2.6-5.4 2.6-5.4-1.1-5.4-2.6z", "#E2D8BC"],
        ["M8.2 11.6h7.6v3.4H8.2z", "#8A7D62"]
      ]
    },
    K\u00FClmutatud: {
      bg: "#DBF0F6",
      parts: [
        ["M12 3.8v16.4M4.9 7.9l14.2 8.2M19.1 7.9L4.9 16.1", null, "#3FA9C6", 2.1],
        ["M12 6.6l2-2M12 6.6l-2-2M12 17.4l2 2M12 17.4l-2 2", null, "#3FA9C6", 2.1]
      ]
    },
    Joogid: {
      bg: "#E7E0FB",
      parts: [
        ["M9.6 3.4h4.8v2.6l1.8 3V19a1.6 1.6 0 01-1.6 1.6H9.4A1.6 1.6 0 017.8 19V9l1.8-3z", "#EDE7FC"],
        ["M7.8 12.6h8.4V19a1.6 1.6 0 01-1.6 1.6H9.4A1.6 1.6 0 017.8 19z", "#8B5CF6"],
        ["M9.4 2.6h5.2v1.8H9.4z", "#5B21B6"]
      ]
    },
    "Maiustused ja sn\xE4kid": {
      bg: "#FBDDE9",
      parts: [
        ["M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z", "#EC4899"],
        ["M8.2 9.6L4.8 7.2v9.6l3.4-2.4zM15.8 9.6l3.4-2.4v9.6l-3.4-2.4z", "#F7A8CC"]
      ]
    },
    Majapidamine: {
      bg: "#E4E7EA",
      parts: [
        ["M9.4 8.6h5.2V19a1.6 1.6 0 01-1.6 1.6h-2A1.6 1.6 0 019.4 19z", "#9AA4AE"],
        ["M9.4 12.4h5.2V19a1.6 1.6 0 01-1.6 1.6h-2A1.6 1.6 0 019.4 19z", "#3B9AE1"],
        ["M10.6 8.6V4.6h4M15.4 4.6h3.2M15.4 6.6h3.2", null, "#5E6B76", 1.5]
      ]
    },
    "H\xFCgieen ja ilu": {
      bg: "#EEE3FA",
      parts: [
        ["M12 3.6s5.6 5.9 5.6 9.6a5.6 5.6 0 11-11.2 0c0-3.7 5.6-9.6 5.6-9.6z", "#A855F7"],
        ["M9.6 13.4c0 2 1.1 3.4 2.6 3.9-2.4.5-4.4-1-4.4-3.3 0-1 .5-2.2 1.2-3.3.3.9.6 1.8.6 2.7z", "#DCC4F7"]
      ]
    },
    Lemmikloom: {
      bg: "#F1E6D2",
      parts: [
        ["M12 12.4c2.6 0 4.6 2.3 4.6 4.4 0 1.8-1.5 2.8-3.1 2.8-.7 0-1-.3-1.5-.3s-.8.3-1.5.3c-1.6 0-3.1-1-3.1-2.8 0-2.1 2-4.4 4.6-4.4z", "#B08A5A"],
        ["M8.6 6.6c1 0 1.8 1.1 1.8 2.4S9.6 11.4 8.6 11.4 6.8 10.3 6.8 9 7.6 6.6 8.6 6.6zM15.4 6.6c1 0 1.8 1.1 1.8 2.4s-.8 2.4-1.8 2.4-1.8-1.1-1.8-2.4.8-2.4 1.8-2.4zM5 11c.9 0 1.6 1 1.6 2.1s-.7 2.1-1.6 2.1-1.6-1-1.6-2.1S4.1 11 5 11zM19 11c.9 0 1.6 1 1.6 2.1s-.7 2.1-1.6 2.1-1.6-1-1.6-2.1.7-2.1 1.6-2.1z", "#B08A5A"]
      ]
    },
    Muu: {
      bg: "#E8E9EC",
      parts: [
        ["M4.6 8.2L12 4.4l7.4 3.8v7.6L12 19.6l-7.4-3.8z", "#B6BCC4"],
        ["M4.6 8.2L12 12v7.6l-7.4-3.8z", "#98A0AA"],
        ["M12 12l7.4-3.8v7.6L12 19.6z", "#C9CFD6"]
      ]
    }
  };
  function CatIcon({ category, size = 36 }) {
    const art = CAT_ART[category] || CAT_ART.Muu;
    const inner = Math.round(size * 0.78);
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          width: size,
          height: size,
          borderRadius: size / 2,
          background: art.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement("svg", { width: inner, height: inner, viewBox: "0 0 24 24", "aria-hidden": "true" }, art.parts.map(([d, fill, stroke, w], i) => /* @__PURE__ */ React.createElement(
        "path",
        {
          key: i,
          d,
          fill: fill || "none",
          stroke: stroke || "none",
          strokeWidth: w || 0,
          strokeLinecap: "round"
        }
      )))
    );
  }
  function Donut({ segments, total, label, size = 168, thick = 18 }) {
    const r = (size - thick) / 2;
    const circ = 2 * Math.PI * r;
    let acc = 0;
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: size, height: size, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("svg", { width: size, height: size, style: { transform: "rotate(-90deg)" } }, /* @__PURE__ */ React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "#E7EDF3", strokeWidth: thick }), segments.map(([name, value, color]) => {
      const frac = total > 0 ? value / total : 0;
      const dash = Math.max(frac * circ - 3, 1);
      const el = /* @__PURE__ */ React.createElement(
        "circle",
        {
          key: name,
          cx: size / 2,
          cy: size / 2,
          r,
          fill: "none",
          stroke: color,
          strokeWidth: thick,
          strokeLinecap: "round",
          strokeDasharray: `${dash} ${circ - dash}`,
          strokeDashoffset: -acc * circ
        }
      );
      acc += frac;
      return el;
    })), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", ...num } }, label),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: T.faint, marginTop: 2 } }, "kulutatud")
    ));
  }
  function Icon({ name, size = 17 }) {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true"
      },
      /* @__PURE__ */ React.createElement("path", { d: ICONS[name] })
    );
  }
  function Btn({ children, onClick, kind = "quiet", style, full }) {
    const kinds = {
      solid: { background: T.gold, color: "#fff", fontWeight: 700 },
      quiet: { background: T.raised, color: T.gold },
      bare: { background: "transparent", color: T.faint },
      warn: { background: tint(T.out, 0.1), color: T.out }
    };
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick,
        style: {
          border: "none",
          borderRadius: 999,
          padding: "12px 18px",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: FONT,
          cursor: "pointer",
          width: full ? "100%" : void 0,
          ...kinds[kind],
          ...style
        }
      },
      children
    );
  }
  function ConfirmBtn({ label, confirmLabel, onConfirm, style }) {
    const [armed, setArmed] = useState(false);
    useEffect(() => {
      if (!armed) return;
      const t = setTimeout(() => setArmed(false), 4e3);
      return () => clearTimeout(t);
    }, [armed]);
    return /* @__PURE__ */ React.createElement(Btn, { kind: "warn", full: true, style, onClick: () => armed ? onConfirm() : setArmed(true) }, armed ? confirmLabel : label);
  }
  const field = (extra = {}) => ({
    border: "none",
    background: "#EEF2F7",
    borderRadius: 14,
    padding: "11px 13px",
    fontSize: 15,
    fontFamily: FONT,
    color: T.ink,
    outline: "none",
    WebkitAppearance: "none",
    appearance: "none",
    ...extra
  });
  function Panel({ children, style }) {
    return /* @__PURE__ */ React.createElement("div", { style: { background: T.surface, borderRadius: 20, padding: 18, ...style } }, children);
  }
  function Label({ children, style }) {
    return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginBottom: 12, ...style } }, children);
  }
  function Mascot({ mood, size = 88, style }) {
    return /* @__PURE__ */ React.createElement(
      "img",
      {
        src: mood === "hungry" ? "img/tegelane-hungry.png" : "img/tegelane-full.png",
        alt: "",
        width: size,
        height: size,
        className: mood === "hungry" ? "nm-pat" : "nm-hop",
        style: { display: "block", flexShrink: 0, ...style }
      }
    );
  }
  function Empty({ title, hint }) {
    return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "72px 30px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, color: T.ink, marginBottom: 8 } }, title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, color: T.faint, lineHeight: 1.55 } }, hint));
  }
  function Sheet({ children, onClose, z = 50 }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: onClose,
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(21,19,28,.35)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: z,
          animation: "fadein .18s ease"
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: T.bg,
            width: "100%",
            maxWidth: 480,
            borderRadius: "26px 26px 0 0",
            padding: "10px 16px 30px",
            maxHeight: "90vh",
            overflowY: "auto",
            animation: "slideup .24s cubic-bezier(.22,1,.36,1)"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              width: 38,
              height: 4,
              borderRadius: 2,
              background: "#D5DEE7",
              margin: "0 auto 18px"
            }
          }
        ),
        children
      )
    );
  }
  function GaugeRow({ p, onClick, children, muted }) {
    const pct = Math.min(p.progress / 1.3, 1) * 100;
    const c = progressColor(p.progress);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: T.surface,
          borderRadius: 14,
          marginBottom: 6,
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { padding: "11px 13px 12px" } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: onClick ? "pointer" : "default"
          }
        },
        /* @__PURE__ */ React.createElement(CatIcon, { category: p.category, size: 30 }),
        /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              fontSize: 15.5,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: muted ? "line-through" : "none"
            }
          },
          p.name
        ), /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              fontSize: 12,
              color: T.faint,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }
          },
          "ostetud ",
          relDays(p.daysSincePurchase),
          !p.confident && " \xB7 esialgne"
        )),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              fontSize: 13,
              color: c,
              fontWeight: 700,
              flexShrink: 0,
              ...num
            }
          },
          p.daysLeft === 0 ? "otsas" : `${p.daysLeft} p`
        )
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            marginTop: 10,
            height: 5,
            borderRadius: 3,
            background: T.hair,
            overflow: "hidden"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              width: `${pct}%`,
              height: "100%",
              borderRadius: 3,
              background: c,
              transition: "width .45s cubic-bezier(.22,1,.36,1), background .45s ease"
            }
          }
        )
      ), children)
    );
  }
  function QtyStepper({ value, onChange, min = 1, max = 99, suffix }) {
    const btnStyle = {
      width: 34,
      height: 34,
      borderRadius: "50%",
      border: "none",
      background: T.surface,
      color: T.ink,
      fontSize: 17,
      lineHeight: 1,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: T.raised,
          borderRadius: 999,
          padding: 2,
          flexShrink: 0
        },
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          "aria-label": "V\xE4hem",
          style: btnStyle,
          onClick: () => onChange(Math.max(min, value - 1))
        },
        "\u2212"
      ),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            minWidth: 18,
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            padding: suffix ? "0 3px" : 0
          }
        },
        value,
        suffix ? ` ${suffix}` : ""
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          "aria-label": "Rohkem",
          style: btnStyle,
          onClick: () => onChange(Math.min(max, value + 1))
        },
        "+"
      )
    );
  }
  function ListView({ products, data, save, onOpen }) {
    const [newItem, setNewItem] = useState("");
    const [focused, setFocused] = useState(false);
    const [notice, setNotice] = useState("");
    const [noticeTone, setNoticeTone] = useState(T.soon);
    const [quickStart, setQuickStart] = useState(false);
    const cart = data.cart || {};
    const want = data.want || {};
    const wantOf = (k) => want[k] || products.find((x) => x.k === k)?.usual?.count || 1;
    const setWant = (k, n) => save({ ...data, want: { ...want, [k]: Math.max(1, Math.round(n)) } });
    const without = (obj, k) => Object.fromEntries(Object.entries(obj || {}).filter(([x]) => x !== k));
    const byCategory = !!data.settings?.store;
    const order = byCategory ? CATEGORY_ORDER : null;
    const needed = products.filter((p) => !p.hidden && p.progress >= 0.7);
    const outCount = needed.filter((p) => p.progress >= 1).length;
    const soonCount = needed.length - outCount;
    const watching = products.filter(
      (p) => !p.hidden && p.progress >= 0.35 && p.progress < 0.7
    );
    const cartCount = Object.keys(cart).length;
    const toggleCart = (k) => {
      const next = { ...cart };
      if (next[k]) delete next[k];
      else next[k] = wantOf(k);
      save({ ...data, cart: next });
    };
    const setCartQty = (k, qty) => {
      if (!cart[k]) return;
      save({ ...data, cart: { ...cart, [k]: Math.max(1, Math.round(qty)) } });
    };
    const stillHave = (p) => save({ ...data, stillHave: { ...data.stillHave, [p.k]: today() }, want: without(want, p.k) });
    const finishTrip = () => {
      const bought = Object.keys(cart).map((k) => {
        const known = products.find((p) => p.k === k);
        if (known) return known;
        const extra = data.extras.find((e) => key(e.name) === k);
        return { k, name: extra ? extra.name : k, category: "Muu", lastPrice: null };
      });
      const priced = bought.filter((p) => p.lastPrice > 0);
      const unpriced = bought.filter((p) => !(p.lastPrice > 0));
      const qtyOf = (p) => Math.max(1, Math.round(cart[p.k]) || 1);
      const estReceipt = priced.length > 0 ? [
        {
          id: uid(),
          store: "Hinnang",
          date: today(),
          estimated: true,
          total: priced.reduce((a, p) => a + (p.lastPrice || 0) * qtyOf(p), 0),
          lines: priced.map((p) => ({
            name: p.name,
            category: p.category,
            qty: qtyOf(p),
            unit: "tk",
            unitPrice: p.lastPrice,
            total: p.lastPrice * qtyOf(p)
          }))
        }
      ] : [];
      save({
        ...data,
        receipts: [...data.receipts, ...estReceipt],
        manualPurchases: [
          ...data.manualPurchases,
          ...unpriced.map((p) => ({
            id: uid(),
            name: p.name,
            category: p.category,
            date: today(),
            qty: qtyOf(p)
          }))
        ],
        extras: data.extras.filter((e) => !cart[key(e.name)]),
        stillHave: Object.fromEntries(
          Object.entries(data.stillHave).filter(([k]) => !cart[k])
        ),
        // Kui toodet, mille jälgimine oli varem peatatud ("Ära jälgi seda"), nüüd
        // ikkagi ostetakse, hakkab äpp seda automaatselt taas jälgima — muidu jääks
        // see igaveseks vaikimisi peidetuks, kuni keegi mäletab seda käsitsi tagasi lülitada.
        hidden: Object.fromEntries(Object.entries(data.hidden).filter(([k]) => !cart[k])),
        want: Object.fromEntries(Object.entries(want).filter(([k]) => !cart[k])),
        cart: {}
      });
      setNoticeTone(T.fresh);
      setNotice(`Ostureis l\xF5petatud \u2014 ${bought.length} ${bought.length === 1 ? "toode" : "toodet"} kirja pandud.`);
    };
    const addExtra = (name) => {
      const raw = (name ?? newItem).trim();
      if (!raw) return;
      const { name: t, count, amount } = name != null ? { name: raw } : parseListInput(raw);
      const k = key(t);
      const qtyText = count ? `${count} tk` : amount ? fmtAmount(amount) : "";
      const done = (msg, tone) => {
        setNoticeTone(tone);
        setNotice(msg);
        setNewItem("");
        setFocused(false);
      };
      const existing = data.extras.find((e) => key(e.name) === k);
      if (existing) {
        if (count) setWant(k, count);
        else if (amount)
          save({
            ...data,
            extras: data.extras.map((e) => e.id === existing.id ? { ...e, amounts: [toBase(amount)] } : e)
          });
        return done(
          qtyText ? `${existing.name}: kogus muudetud, ${qtyText}` : `${t} on juba nimekirjas`,
          qtyText ? T.fresh : T.soon
        );
      }
      const already = needed.find((x) => x.k === k);
      if (already) {
        if (count) setWant(k, count);
        return done(
          count ? `${already.name} on nimekirjas \xFClal, kogus ${qtyText}` : `${already.name} on nimekirjas juba \xFClal`,
          count ? T.fresh : T.soon
        );
      }
      const known = products.find((x) => x.k === k && !x.hidden);
      save({
        ...data,
        extras: [...data.extras, { id: uid(), name: t, ...amount ? { amounts: [toBase(amount)] } : {} }],
        want: count ? { ...want, [k]: count } : want
      });
      if (known && !known.bag) {
        setNoticeTone(progressColor(known.progress));
        setNotice(
          known.progress < 0.35 ? `${known.name} lisatud. Kas seda ikka vaja on? \xC4pi hinnangul peaks kodus veel j\xE4tkuma ~${known.daysLeft} p\xE4eva.` : `${known.name} lisatud \u2014 \xE4pi hinnangul j\xE4tkub veel ${known.daysLeft} p\xE4eva.`
        );
      } else {
        setNotice("");
      }
      setNewItem("");
      setFocused(false);
    };
    useEffect(() => {
      if (!notice) return;
      const t = setTimeout(() => setNotice(""), 4e3);
      return () => clearTimeout(t);
    }, [notice]);
    const q = newItem.trim().toLowerCase();
    const suggestions = products.filter(
      (x) => !x.bag && (!q || x.name.toLowerCase().includes(q)) && !data.extras.some((e) => key(e.name) === x.k) && !needed.some((nd) => nd.k === x.k)
    ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 8);
    const catOf = (p) => CATEGORY_ORDER.includes(p.category) ? p.category : "Muu";
    const groups = order ? order.map((cat) => [cat, needed.filter((p) => catOf(p) === cat)]).filter(([, items]) => items.length) : [[null, needed]];
    const renderRow = (p) => {
      const inCart = !!cart[p.k];
      return /* @__PURE__ */ React.createElement("div", { key: p.k, style: { opacity: inCart ? 0.55 : 1 } }, /* @__PURE__ */ React.createElement(GaugeRow, { p, onClick: () => onOpen(p), muted: inCart }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            display: "flex",
            gap: 6,
            marginTop: 9,
            justifyContent: "space-between",
            alignItems: "center"
          }
        },
        p.usual?.count ? /* @__PURE__ */ React.createElement(
          QtyStepper,
          {
            value: inCart ? cart[p.k] || 1 : wantOf(p.k),
            suffix: p.usual.unit,
            onChange: (n) => inCart ? setCartQty(p.k, n) : setWant(p.k, n)
          }
        ) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: T.soft, paddingLeft: 4, ...num } }, "tavaliselt ~", fmtAmount(p.usual.amount)),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, !inCart && /* @__PURE__ */ React.createElement(
          Btn,
          {
            kind: "quiet",
            style: { padding: "10px 14px", fontSize: 13, minHeight: 40 },
            onClick: () => stillHave(p)
          },
          "On veel"
        ), /* @__PURE__ */ React.createElement(
          Btn,
          {
            kind: inCart ? "quiet" : "solid",
            style: { padding: "10px 16px", fontSize: 13, minHeight: 40 },
            onClick: () => toggleCart(p.k)
          },
          inCart ? "V\xF5ta korvist" : "Korvi"
        ))
      )));
    };
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, nextShop(data.settings).days > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginBottom: 12, lineHeight: 1.5 } }, "Arvestan j\xE4rgmise poesk\xE4iguga ", nextShop(data.settings).label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: newItem,
        onChange: (e) => setNewItem(e.target.value),
        onFocus: () => setFocused(true),
        onKeyDown: (e) => e.key === "Enter" && addExtra(),
        placeholder: "Lisa nimekirja, nt Kodujuust 3",
        style: field({ flex: 1, background: T.surface })
      }
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", onClick: () => addExtra() }, "Lisa")), notice && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: tintAny(noticeTone, 0.12),
          color: noticeTone,
          borderRadius: 12,
          padding: "10px 13px",
          fontSize: 13,
          marginBottom: 12,
          lineHeight: 1.45,
          fontWeight: 500
        }
      },
      notice
    ), (focused || q) && suggestions.length > 0 && /* @__PURE__ */ React.createElement(Panel, { style: { padding: "6px 14px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontSize: 12,
          color: T.faint,
          padding: "8px 0 4px"
        }
      },
      q ? "Varem ostetud" : "Ostad neid k\xF5ige sagedamini"
    ), suggestions.map((x, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: x.k,
        onClick: () => addExtra(x.name),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`,
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ React.createElement(CatIcon, { category: x.category, size: 26 }),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            flex: 1,
            fontSize: 14.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        x.name
      ),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: T.faint, ...num } }, x.count, "\xD7"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17, color: T.gold, fontWeight: 700 } }, "+")
    )), focused && !q && /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => setFocused(false),
        style: {
          textAlign: "center",
          fontSize: 12.5,
          color: T.faint,
          padding: "9px 0 7px",
          borderTop: `1px solid ${T.hair}`,
          cursor: "pointer"
        }
      },
      "Peida"
    )), outCount > 0 && /* @__PURE__ */ React.createElement(
      Panel,
      {
        style: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px 12px 10px", marginBottom: 14 }
      },
      /* @__PURE__ */ React.createElement(Mascot, { mood: "hungry", size: 76 }),
      /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: T.ink } }, outCount === 1 ? "1 toode on otsas" : `${outCount} toodet on otsas`), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 3, lineHeight: 1.45 } }, soonCount > 0 ? `K\xF5ht juba koriseb. Veel ${soonCount} ${soonCount === 1 ? "toode saab" : "toodet saab"} varsti otsa.` : "K\xF5ht juba koriseb, aeg poodi minna."))
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: T.faint, marginBottom: 6, letterSpacing: ".02em" } }, "J\xE4rjesta nimekiri"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } }, [
      ["", "Kiireloomulisuse j\xE4rgi"],
      ["category", "Kategooriate j\xE4rgi"]
    ].map(([id, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: label,
        onClick: () => save({ ...data, settings: { ...data.settings, store: id } }),
        style: storeChip(id ? byCategory : !byCategory)
      },
      label
    ))), data.extras.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 22 } }, data.extras.map((e) => {
      const k = key(e.name);
      const inCart = !!cart[k];
      const hasAmounts = e.amounts?.length > 0;
      const sub = [hasAmounts ? fmtAmounts(e.amounts) : "", (e.from || []).join(", ")].filter(Boolean).join(" \xB7 ");
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: e.id,
          style: {
            background: T.surface,
            borderRadius: 14,
            padding: "11px 13px 12px",
            marginBottom: 6,
            opacity: inCart ? 0.55 : 1
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              width: 30,
              height: 30,
              borderRadius: 15,
              background: "#EEF2F7",
              color: T.faint,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }
          },
          "+"
        ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              fontSize: 15.5,
              letterSpacing: "-0.01em",
              textDecoration: inCart ? "line-through" : "none"
            }
          },
          e.name
        ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: T.faint, marginTop: 2, ...num } }, sub || "lisatud k\xE4sitsi")), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            "aria-label": `Eemalda ${e.name}`,
            onClick: () => save({ ...data, extras: data.extras.filter((x) => x.id !== e.id), want: without(want, k) }),
            style: {
              border: "none",
              background: "transparent",
              color: T.faint,
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
              padding: "4px 2px",
              flexShrink: 0
            }
          },
          "\xD7"
        )),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              gap: 6,
              marginTop: 9,
              justifyContent: hasAmounts ? "flex-end" : "space-between",
              alignItems: "center"
            }
          },
          !hasAmounts && /* @__PURE__ */ React.createElement(
            QtyStepper,
            {
              value: inCart ? cart[k] || 1 : wantOf(k),
              suffix: products.find((x) => x.k === k)?.usual?.unit || "tk",
              onChange: (n) => inCart ? setCartQty(k, n) : setWant(k, n)
            }
          ),
          /* @__PURE__ */ React.createElement(
            Btn,
            {
              kind: inCart ? "quiet" : "solid",
              style: { padding: "10px 16px", fontSize: 13, minHeight: 40 },
              onClick: () => toggleCart(k)
            },
            inCart ? "V\xF5ta korvist" : "Korvi"
          )
        )
      );
    })), products.length === 0 && data.extras.length === 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      Empty,
      {
        title: "Nimekiri on t\xFChi",
        hint: "\xC4pp vajab teadmist, mida te tavaliselt ostate. Vali kiiresti tuttavad tooted v\xF5i lisa esimene t\u0161ekk."
      }
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: () => setQuickStart(true) }, "Vali tavalised tooted")), products.length > 0 && needed.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { paddingTop: 24 } }, /* @__PURE__ */ React.createElement(Mascot, { mood: "full", size: 120, style: { margin: "0 auto" } }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: -56 } }, /* @__PURE__ */ React.createElement(
      Empty,
      {
        title: "K\xF5ik on praegu olemas",
        hint: "Midagi ei ole veel otsakorral. Nimekiri t\xE4ieneb iseenesest, kui midagi hakkab otsa saama."
      }
    ))), groups.map(([cat, items]) => /* @__PURE__ */ React.createElement("div", { key: cat || "all", style: { marginBottom: cat ? 14 : 0 } }, cat && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 9,
          margin: "4px 2px 8px"
        }
      },
      /* @__PURE__ */ React.createElement(CatIcon, { category: cat, size: 22 }),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, color: T.faint, letterSpacing: ".04em" } }, cat.toUpperCase())
    ), items.map(renderRow))), !(products.length === 0 && data.extras.length === 0) && /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "bare",
        full: true,
        style: { marginTop: 14 },
        onClick: () => setQuickStart(true)
      },
      "Lisa veel tavalisi tooteid"
    ), watching.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 26 } }, /* @__PURE__ */ React.createElement(Label, null, "Veel kodus"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, lineHeight: 1.5, margin: "-2px 2px 6px" } }, "Need peaksid kodus veel j\xE4tkuma. Kui m\xF5ni hakkab otsa saama, t\xF5stab \xE4pp selle ise \xFCles nimekirja."), watching.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.k, onClick: () => onOpen(p), style: { padding: "11px 2px", cursor: "pointer" } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, p.name),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13.5, color: T.faint, whiteSpace: "nowrap", ...num } }, "j\xE4tkub veel ~", p.daysLeft, " ", p.daysLeft === 1 ? "p\xE4ev" : "p\xE4eva")
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          height: 4,
          borderRadius: 2,
          background: tint(T.ink, 0.06),
          overflow: "hidden",
          marginTop: 7
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            width: `${Math.min(p.progress / 1.3, 1) * 100}%`,
            height: "100%",
            background: progressColor(p.progress),
            borderRadius: 2
          }
        }
      )
    )))), cartCount > 0 && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          left: 14,
          right: 14,
          bottom: 92,
          maxWidth: 452,
          margin: "0 auto",
          zIndex: 30
        }
      },
      /* @__PURE__ */ React.createElement(
        Btn,
        {
          kind: "solid",
          full: true,
          style: { padding: "14px 0", boxShadow: "0 8px 24px rgba(18,58,99,.28)" },
          onClick: finishTrip
        },
        "L\xF5peta ostureis \xB7 ",
        cartCount,
        " korvis"
      )
    ), quickStart && /* @__PURE__ */ React.createElement(
      QuickStartSheet,
      {
        data,
        save,
        onClose: () => setQuickStart(false)
      }
    ));
  }
  const storeChip = (on) => ({
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12.5,
    fontWeight: on ? 700 : 500,
    fontFamily: FONT,
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: on ? tint(T.gold, 0.16) : T.raised,
    color: on ? T.gold : T.soft
  });
  function QuickStartSheet({ data, save, onClose, z = 70 }) {
    const [picked, setPicked] = useState({});
    const n = Object.keys(picked).length;
    const toggle = (name) => {
      const next = { ...picked };
      if (next[name]) delete next[name];
      else next[name] = true;
      setPicked(next);
    };
    const commit = () => {
      const entries = COMMON.filter(([name]) => picked[name]);
      save({
        ...data,
        manualPurchases: [
          ...data.manualPurchases,
          ...entries.map(([name, category]) => {
            const cycle = PRIOR[category] ?? 14;
            const frac = 0.4 + Math.random() * 0.45;
            return {
              id: uid(),
              name,
              category,
              date: daysAgo(Math.round(cycle * frac)),
              qty: 1
            };
          })
        ]
      });
      onClose();
    };
    const byCat = {};
    COMMON.forEach(([name, cat]) => {
      (byCat[cat] = byCat[cat] || []).push(name);
    });
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 4 } }, "Mida te tavaliselt ostate?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.faint, marginBottom: 16, lineHeight: 1.55 } }, "M\xE4rgi tooted, mida teie pere tavaliselt ostab. Need l\xE4hevad kohe ostunimekirja, sest t\u0161ekki nende kohta veel pole. Kui esimese t\u0161eki teed, hakkab \xE4pp arvestama p\xE4ris kuup\xE4evi ja koguseid."), Object.entries(byCat).map(([cat, names]) => /* @__PURE__ */ React.createElement("div", { key: cat, style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 8 } }, /* @__PURE__ */ React.createElement(CatIcon, { category: cat, size: 22 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, color: T.faint } }, cat)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, names.map((name) => {
      const on = !!picked[name];
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: name,
          onClick: () => toggle(name),
          style: {
            border: "none",
            borderRadius: 999,
            padding: "9px 14px",
            fontSize: 14,
            fontFamily: FONT,
            fontWeight: on ? 600 : 400,
            cursor: "pointer",
            background: on ? tint(T.gold, 0.16) : T.raised,
            color: on ? T.gold : T.soft
          }
        },
        name
      );
    })))), /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "solid",
        full: true,
        style: { marginTop: 8, marginBottom: 8, padding: "13px 0" },
        onClick: n ? commit : onClose
      },
      n ? `Lisa ${n} toodet nimekirja` : "J\xE4tan vahele"
    ));
  }
  function LineEditor({ line, onChange, onDelete, knownProducts }) {
    const l = line;
    const low = l.conf != null && l.conf < 0.7;
    const handleNameChange = (name) => {
      const patch = { name };
      if ((!l.category || l.category === "Muu") && knownProducts) {
        const match = knownProducts.find((p) => p.k === key(name));
        if (match) patch.category = match.category;
      }
      onChange(patch);
    };
    const cell = (extra = {}) => ({
      border: "none",
      background: "#EEF2F7",
      borderRadius: 10,
      padding: "7px 9px",
      fontSize: 13.5,
      fontFamily: FONT,
      color: T.ink,
      outline: "none",
      WebkitAppearance: "none",
      appearance: "none",
      minWidth: 0,
      ...extra
    });
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: T.surface,
          borderRadius: 12,
          padding: 9,
          marginBottom: 6,
          boxShadow: low ? `inset 3px 0 0 ${T.soon}` : "none"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 6 } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          value: l.name,
          onChange: (e) => handleNameChange(e.target.value),
          placeholder: "Tootenimi",
          style: cell({ flex: 1, fontSize: 14.5 })
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          step: "0.01",
          min: "0",
          value: l.total,
          onChange: (e) => {
            const t = Math.max(0, parseFloat(e.target.value) || 0);
            onChange({ total: t, unitPrice: l.qty ? t / l.qty : t });
          },
          style: cell({ width: 66, textAlign: "right", fontWeight: 600, ...num })
        }
      )),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          step: "0.01",
          min: "0",
          value: l.qty,
          onChange: (e) => {
            const q = Math.max(0, parseFloat(e.target.value) || 0);
            onChange({ qty: q, unitPrice: q ? l.total / q : l.total });
          },
          style: cell({ width: 46, textAlign: "center" })
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          value: l.unit,
          onChange: (e) => onChange({ unit: e.target.value }),
          style: cell({ width: 42, textAlign: "center" })
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          value: l.category,
          onChange: (e) => onChange({ category: e.target.value }),
          style: cell({ flex: 1, fontSize: 12.5, color: T.soft })
        },
        CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onDelete,
          "aria-label": "Kustuta rida",
          style: {
            border: "none",
            borderRadius: 999,
            width: 30,
            height: 30,
            flexShrink: 0,
            cursor: "pointer",
            background: tint(T.out, 0.12),
            color: T.out,
            fontSize: 16,
            lineHeight: 1,
            fontFamily: FONT
          }
        },
        "\xD7"
      ))
    );
  }
  function AddView({ data, save, products, goList, imagesOk }) {
    const [stage, setStage] = useState("idle");
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);
    const [savedCount, setSavedCount] = useState(0);
    const fileRef = useRef(null);
    const handleFile = async (file) => {
      if (!file) return;
      setStage("working");
      setError("");
      try {
        const parsed = await readReceipt(file, products.map((p) => p.name));
        if (!parsed.lines.length) throw new Error("t\xFChi");
        setDraft(parsed);
        setStage("review");
      } catch (e) {
        setError(
          e.message === "t\xFChi" ? "Ridu ei \xF5nnestunud lugeda. Pildista otse \xFClevalt, hea valgusega, nii et kogu t\u0161ekk mahub kaadrisse." : friendlyError(e)
        );
        setStage("error");
      }
    };
    const update = (id, patch) => setDraft({
      ...draft,
      lines: draft.lines.map((l) => l.id === id ? { ...l, ...patch } : l)
    });
    const commit = () => {
      const raw = draft.lines.filter((l) => l.name.trim()).map(asBag);
      if (!raw.length) return;
      const merged = [];
      raw.forEach((l) => {
        const hit = merged.find((m) => key(m.name) === key(l.name));
        if (hit) {
          hit.qty = (hit.qty || 0) + (l.qty || 0);
          hit.total = (hit.total || 0) + (l.total || 0);
          hit.unitPrice = hit.qty ? hit.total / hit.qty : hit.unitPrice;
        } else merged.push({ ...l });
      });
      const lines = merged;
      const cleared = { ...data.stillHave };
      const clearedCart = { ...data.cart };
      const clearedWant = { ...data.want || {} };
      lines.forEach((l) => {
        delete cleared[key(l.name)];
        delete clearedCart[key(l.name)];
        delete clearedWant[key(l.name)];
      });
      const names = new Set(lines.map((l) => key(l.name)));
      const WINDOW = 14;
      const manualPurchases = data.manualPurchases.filter(
        (m) => !(names.has(key(m.name)) && Math.abs(daysBetween(m.date, draft.date)) <= WINDOW)
      );
      const receipts = data.receipts.map((r) => {
        if (!r.estimated) return r;
        if (Math.abs(daysBetween(r.date, draft.date)) > WINDOW) return r;
        const keptLines = r.lines.filter((l) => !names.has(key(l.name)));
        if (keptLines.length === r.lines.length) return r;
        return { ...r, lines: keptLines, total: keptLines.reduce((a, b) => a + (b.total || 0), 0) };
      }).filter((r) => !(r.estimated && (!r.lines || r.lines.length === 0)));
      save({
        ...data,
        manualPurchases,
        cart: clearedCart,
        receipts: [
          ...receipts,
          {
            id: uid(),
            store: draft.store.trim() || "M\xE4\xE4ramata",
            date: draft.date,
            total: lines.reduce((a, b) => a + b.total, 0),
            lines: lines.map(({ id, conf, ...rest }) => rest)
          }
        ],
        stillHave: cleared,
        want: clearedWant,
        // Ostetud toode, mille jälgimine oli peatatud, läheb automaatselt taas jälgimisele.
        hidden: Object.fromEntries(Object.entries(data.hidden).filter(([k]) => !names.has(k)))
      });
      setSavedCount(lines.length);
      setDraft(null);
      setStage("saved");
      setTimeout(() => {
        setStage("idle");
        goList();
      }, 1100);
    };
    if (stage === "saved")
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            padding: "60px 14px",
            textAlign: "center",
            animation: "fadein .18s ease"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              width: 56,
              height: 56,
              borderRadius: 28,
              background: tint(T.fresh, 0.14),
              color: T.fresh,
              fontSize: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }
          },
          "\u2713"
        ),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600 } }, "T\u0161ekk salvestatud \u2014 ", savedCount, " ", savedCount === 1 ? "toode" : "toodet")
      );
    if (stage === "working")
      return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px" } }, [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          style: {
            height: 62,
            borderRadius: 14,
            background: T.surface,
            marginBottom: 7,
            opacity: 0.9,
            animation: `pulse 1.4s ease-in-out ${i * 0.18}s infinite`
          }
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: T.faint, fontSize: 14, marginTop: 22 } }, "Loen t\u0161ekki"));
    if (stage === "review" && draft) {
      const sum = draft.lines.reduce((a, b) => a + (b.total || 0), 0);
      const mismatch = draft.total > 0 && Math.abs(sum - draft.total) > 0.05;
      return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          value: draft.store,
          onChange: (e) => setDraft({ ...draft, store: e.target.value }),
          placeholder: "Pood",
          style: field({ flex: 1, background: T.surface })
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: draft.date,
          onChange: (e) => setDraft({ ...draft, date: e.target.value }),
          style: field({ width: 148, background: T.surface, fontSize: 14 })
        }
      )), mismatch && /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            background: tint(T.soon, 0.12),
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13.5,
            color: T.soon,
            marginBottom: 12,
            lineHeight: 1.5
          }
        },
        "Ridade summa ",
        eur(sum),
        ", t\u0161ekil ",
        eur(draft.total),
        ". M\xF5ni number on valesti loetud."
      ), draft.lines.map((l) => /* @__PURE__ */ React.createElement(
        LineEditor,
        {
          key: l.id,
          line: l,
          knownProducts: products,
          onChange: (patch) => update(l.id, patch),
          onDelete: () => setDraft({ ...draft, lines: draft.lines.filter((x) => x.id !== l.id) })
        }
      )), /* @__PURE__ */ React.createElement(
        Btn,
        {
          full: true,
          style: { marginBottom: 14 },
          onClick: () => setDraft({
            ...draft,
            lines: [
              ...draft.lines,
              {
                id: uid(),
                name: "",
                category: "Muu",
                qty: 1,
                unit: "tk",
                unitPrice: 0,
                total: 0
              }
            ]
          })
        },
        "Lisa rida k\xE4sitsi"
      ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "solid", style: { flex: 1, padding: "13px 0" }, onClick: commit }, "Salvesta ", draft.lines.length, " rida"), /* @__PURE__ */ React.createElement(
        Btn,
        {
          onClick: () => {
            setDraft(null);
            setStage("idle");
          }
        },
        "Loobu"
      )));
    }
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, stage === "error" && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: tint(T.out, 0.12),
          borderRadius: 12,
          padding: "13px 15px",
          fontSize: 14,
          color: T.out,
          marginBottom: 14,
          lineHeight: 1.5
        }
      },
      error
    ), imagesOk !== false && /* @__PURE__ */ React.createElement(Panel, { style: { padding: "34px 20px", textAlign: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "svg",
      {
        width: "46",
        height: "46",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: T.ink,
        strokeWidth: "1.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: { marginBottom: 16, opacity: 0.9 }
      },
      /* @__PURE__ */ React.createElement("path", { d: "M5 3v18l2.2-1.4L9.4 21l2.2-1.4L13.8 21l2.2-1.4L18.2 21 19 20.4V3z" }),
      /* @__PURE__ */ React.createElement("path", { d: "M9 8h6M9 12h6M9 16h3" })
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, marginBottom: 7, letterSpacing: "-0.01em" } }, "Pildista t\u0161ekk"), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontSize: 14,
          color: T.faint,
          lineHeight: 1.55,
          maxWidth: 250,
          margin: "0 auto 20px"
        }
      },
      "Otse \xFClevalt, hea valgusega, kogu t\u0161ekk kaadris"
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center" } }, /* @__PURE__ */ React.createElement(
      "label",
      {
        style: {
          position: "relative",
          display: "inline-block",
          background: T.ink,
          color: "#fff",
          borderRadius: 999,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer"
        }
      },
      "Pildista",
      /* @__PURE__ */ React.createElement(
        "input",
        {
          ref: fileRef,
          type: "file",
          accept: "image/*",
          capture: "environment",
          onChange: (e) => handleFile(e.target.files?.[0]),
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer"
          }
        }
      )
    ), /* @__PURE__ */ React.createElement(
      "label",
      {
        style: {
          position: "relative",
          display: "inline-block",
          background: tint(T.ink, 0.06),
          color: T.ink,
          borderRadius: 999,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer"
        }
      },
      "Vali fail",
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "file",
          accept: "image/*",
          onChange: (e) => handleFile(e.target.files?.[0]),
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer"
          }
        }
      )
    ))), imagesOk === false && /* @__PURE__ */ React.createElement(Panel, { style: { padding: "24px 20px", textAlign: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, marginBottom: 8, letterSpacing: "-0.01em" } }, "Lisa ost k\xE4sitsi"), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontSize: 14,
          color: T.faint,
          lineHeight: 1.55,
          maxWidth: 300,
          margin: "0 auto 4px"
        }
      },
      "Sisesta poe nimi, kuup\xE4ev ja ostetud tooted koos hindadega \u2014 nii j\xF5uab k\xF5ik jagatud nimekirja ja kulustatistikasse. T\u0161eki automaatne pildistamine lisandub j\xE4rgmises versioonis."
    )), /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: imagesOk === false ? "solid" : "bare",
        full: true,
        style: imagesOk === false ? { padding: "14px 0", fontSize: 15 } : void 0,
        onClick: () => {
          setDraft({ store: "", date: today(), total: 0, lines: [] });
          setStage("review");
        }
      },
      imagesOk === false ? "Lisa ost k\xE4sitsi" : "v\xF5i sisesta ost k\xE4sitsi"
    ), data.receipts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 30 } }, /* @__PURE__ */ React.createElement(Label, null, "Salvestatud t\u0161ekid"), data.receipts.slice().sort((a, b) => b.date.localeCompare(a.date)).map((r) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r.id,
        onClick: () => setEditing(r),
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: T.surface,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 7,
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15.5 } }, r.store), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 2 } }, fmtDate(r.date), " \xB7 ", r.lines.length, " rida")),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, ...num } }, eur(r.total))
    ))), editing && /* @__PURE__ */ React.createElement(
      ReceiptSheet,
      {
        receipt: editing,
        onClose: () => setEditing(null),
        onSave: (r) => {
          save(saveReceipt(data, r));
          setEditing(null);
        },
        onDelete: () => {
          save(removeReceipt(data, editing.id));
          setEditing(null);
        }
      }
    ));
  }
  function ReceiptSheet({ receipt, onClose, onSave, onDelete }) {
    const [r, setR] = useState({
      ...receipt,
      lines: receipt.lines.map((l) => ({ ...l, id: uid() }))
    });
    const update = (id, patch) => setR({ ...r, lines: r.lines.map((l) => l.id === id ? { ...l, ...patch } : l) });
    const sum = r.lines.reduce((a, b) => a + (b.total || 0), 0);
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 60 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 16 } }, "Paranda t\u0161ekk"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 7, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: r.store,
        onChange: (e) => setR({ ...r, store: e.target.value }),
        placeholder: "Pood",
        style: field({ flex: 1, background: T.surface })
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: r.date,
        onChange: (e) => setR({ ...r, date: e.target.value }),
        style: field({ width: 148, background: T.surface, fontSize: 14 })
      }
    )), r.lines.map((l) => /* @__PURE__ */ React.createElement(
      LineEditor,
      {
        key: l.id,
        line: l,
        onChange: (patch) => update(l.id, patch),
        onDelete: () => setR({ ...r, lines: r.lines.filter((x) => x.id !== l.id) })
      }
    )), /* @__PURE__ */ React.createElement(
      Btn,
      {
        full: true,
        style: { marginBottom: 14 },
        onClick: () => setR({
          ...r,
          lines: [
            ...r.lines,
            { id: uid(), name: "", category: "Muu", qty: 1, unit: "tk", unitPrice: 0, total: 0 }
          ]
        })
      },
      "Lisa rida"
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "solid",
        style: { flex: 1, padding: "13px 0" },
        onClick: () => onSave({
          ...r,
          total: sum,
          lines: r.lines.filter((l) => l.name.trim()).map(({ id, conf, ...rest }) => rest)
        })
      },
      "Salvesta muudatused"
    ), /* @__PURE__ */ React.createElement(Btn, { onClick: onClose }, "Loobu")), /* @__PURE__ */ React.createElement(
      ConfirmBtn,
      {
        label: "Kustuta kogu t\u0161ekk",
        confirmLabel: "Vajuta uuesti \u2014 kustutan",
        onConfirm: onDelete
      }
    ));
  }
  function MoneyTab({ data, products, onOpen }) {
    const [view, setView] = useState("kulud");
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, padding: "0 14px 14px" } }, [["kulud", "Kulud"], ["tooted", "Tooted"]].map(([id, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        onClick: () => setView(id),
        style: {
          flex: 1,
          border: "none",
          borderRadius: 999,
          padding: "10px 0",
          fontSize: 14,
          fontFamily: FONT,
          fontWeight: view === id ? 700 : 500,
          cursor: "pointer",
          background: view === id ? T.raised : "transparent",
          color: view === id ? T.gold : T.faint
        }
      },
      label
    ))), view === "kulud" ? /* @__PURE__ */ React.createElement(StatsView, { data }) : /* @__PURE__ */ React.createElement(ProductsView, { products, onOpen }));
  }
  const MONTHS = [
    "jaanuar",
    "veebruar",
    "m\xE4rts",
    "aprill",
    "mai",
    "juuni",
    "juuli",
    "august",
    "september",
    "oktoober",
    "november",
    "detsember"
  ];
  const WD = ["E", "T", "K", "N", "R", "L", "P"];
  function MonthCalendar({ receipts }) {
    const [off, setOff] = useState(0);
    const [openDay, setOpenDay] = useState(null);
    const base = /* @__PURE__ */ new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + off);
    const y = base.getFullYear();
    const m = base.getMonth();
    const first = new Date(y, m, 1);
    const startIdx = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const byDay = {};
    const receiptsByDay = {};
    receipts.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        byDay[d.getDate()] = (byDay[d.getDate()] || 0) + (r.total || 0);
        (receiptsByDay[d.getDate()] = receiptsByDay[d.getDate()] || []).push(r);
      }
    });
    const values = Object.values(byDay);
    const max = values.length ? Math.max(...values) : 0;
    const monthTotal = values.reduce((a, b) => a + b, 0);
    const now = /* @__PURE__ */ new Date();
    const isNow = (d) => now.getFullYear() === y && now.getMonth() === m && now.getDate() === d;
    const cells = [];
    for (let i = 0; i < startIdx; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const navBtn = (label, delta, disabled) => /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => !disabled && setOff(off + delta),
        style: {
          border: "none",
          background: disabled ? "transparent" : T.raised,
          color: disabled ? T.hair : T.gold,
          borderRadius: 999,
          width: 30,
          height: 30,
          fontSize: 15,
          fontFamily: FONT,
          cursor: disabled ? "default" : "pointer"
        }
      },
      label
    );
    return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14
        }
      },
      navBtn("\u2039", -1, false),
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600 } }, MONTHS[m], " ", y), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 2, ...num } }, monthTotal > 0 ? eur(monthTotal) : "kulusid pole")),
      navBtn("\u203A", 1, off >= 0)
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 } }, WD.map((w) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: w,
        style: { textAlign: "center", fontSize: 11, color: T.faint, marginBottom: 2 }
      },
      w
    )), cells.map((d, i) => {
      if (!d) return /* @__PURE__ */ React.createElement("div", { key: `e${i}` });
      const v = byDay[d] || 0;
      const ratio = max > 0 ? v / max : 0;
      const hasReceipts = !!receiptsByDay[d];
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: d,
          role: hasReceipts ? "button" : void 0,
          tabIndex: hasReceipts ? 0 : void 0,
          "aria-label": hasReceipts ? `${d}. ${MONTHS[m]}: vaata t\u0161ekke` : void 0,
          onClick: hasReceipts ? () => setOpenDay(d) : void 0,
          onKeyDown: hasReceipts ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenDay(d)) : void 0,
          style: {
            aspectRatio: "1",
            borderRadius: 9,
            background: v > 0 ? tint(T.gold, 0.08 + ratio * 0.32) : "#EEF2F7",
            border: isNow(d) ? `1.5px solid ${T.gold}` : "1.5px solid transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            cursor: hasReceipts ? "pointer" : "default"
          }
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              fontSize: 11.5,
              color: v > 0 ? T.ink : T.faint,
              fontWeight: v > 0 ? 700 : 400,
              ...num
            }
          },
          d
        ),
        v > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 8.5, color: T.gold, fontWeight: 600, ...num } }, Math.round(v), "\u20AC")
      );
    })), openDay && receiptsByDay[openDay] && /* @__PURE__ */ React.createElement(
      DayReceiptsSheet,
      {
        title: `${openDay}. ${MONTHS[m]} ${y}`,
        receipts: receiptsByDay[openDay],
        onClose: () => setOpenDay(null)
      }
    ));
  }
  function DayReceiptsSheet({ title, receipts, onClose }) {
    const dayTotal = receipts.reduce((a, r) => a + (r.total || 0), 0);
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 60 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em" } }, title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 3, marginBottom: 16, ...num } }, receipts.length === 1 ? "1 t\u0161ekk" : `${receipts.length} t\u0161ekki`, " \xB7 kokku ", eur(dayTotal)), receipts.map((r) => /* @__PURE__ */ React.createElement(Panel, { key: r.id, style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 4
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 600 } }, r.estimated ? "Ostuk\xE4ik" : r.store),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 600, ...num } }, eur(r.total))
    ), r.estimated && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, lineHeight: 1.5, marginBottom: 4 } }, "Hinnanguline: ostuk\xE4ik l\xF5petati ilma t\u0161ekita, hinnad on viimastest ostudest."), r.lines.map((l, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          padding: "9px 0",
          borderTop: `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5 } }, l.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: T.faint, marginTop: 1, ...num } }, l.qty || 1, " ", l.unit || "tk", l.unitPrice > 0 ? ` \xD7 ${eur(l.unitPrice)}` : "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, whiteSpace: "nowrap", ...num } }, eur(l.total))
    )))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, lineHeight: 1.5, margin: "4px 2px 12px" } }, "T\u0161eki parandamiseks ava T\u0161ekk vaade ja vali see \u201ESalvestatud t\u0161ekid\u201C alt."), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sulge"));
  }
  function WeekdayBars({ receipts }) {
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    receipts.forEach((r) => {
      const i = (new Date(r.date).getDay() + 6) % 7;
      sums[i] += r.total || 0;
      counts[i] += 1;
    });
    const max = Math.max(...sums, 1);
    const busiest = sums.indexOf(Math.max(...sums));
    return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "N\xE4dalap\xE4evad"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height: 108 } }, sums.map((v, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10.5, color: T.faint, ...num } }, v > 0 ? Math.round(v) + "\u20AC" : ""),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: Math.max(v / max * 68, v > 0 ? 5 : 3),
            borderRadius: 6,
            background: v > 0 ? i === busiest ? T.gold : tint(T.gold, 0.3) : "#E3E9F0"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontSize: 11.5,
            color: i === busiest ? T.gold : T.faint,
            fontWeight: i === busiest ? 700 : 400
          }
        },
        WD[i]
      )
    ))), counts[busiest] > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 12, lineHeight: 1.5 } }, "K\xF5ige rohkem kulub ", WD[busiest] === "L" ? "laup\xE4eviti" : `p\xE4eval ${WD[busiest]}`, " \u2014", " ", counts[busiest], " ostukorvi, keskmiselt ", eur(sums[busiest] / counts[busiest]), "."));
  }
  function MonthBars({ receipts }) {
    const now = /* @__PURE__ */ new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth(), sum: 0, n: 0 });
    }
    receipts.forEach((r) => {
      const d = new Date(r.date);
      const hit = months.find((x) => x.y === d.getFullYear() && x.m === d.getMonth());
      if (hit) {
        hit.sum += r.total || 0;
        hit.n += 1;
      }
    });
    const withData = months.filter((x) => x.sum > 0);
    if (!withData.length) return null;
    const max = Math.max(...months.map((x) => x.sum), 1);
    const avg = withData.reduce((a, b) => a + b.sum, 0) / withData.length;
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    const change = prev && prev.sum > 0 ? Math.round((last.sum - prev.sum) / prev.sum * 100) : null;
    return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14
        }
      },
      /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 0 } }, "Kuude l\xF5ikes \xB7 viimased 12 kuud"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12.5, color: T.faint, ...num } }, "keskmine ", eur(avg))
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 4, height: 96 } }, months.map((x, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: Math.max(x.sum / max * 62, x.sum > 0 ? 4 : 2),
            borderRadius: 5,
            background: i === months.length - 1 ? T.gold : x.sum > 0 ? tint(T.gold, 0.32) : "#E3E9F0"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontSize: 9.5,
            color: i === months.length - 1 ? T.gold : T.faint,
            fontWeight: i === months.length - 1 ? 700 : 400
          }
        },
        MONTHS[x.m].slice(0, 3)
      )
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 12, lineHeight: 1.5 } }, MONTHS[last.m], " kokku ", eur(last.sum), change !== null && /* @__PURE__ */ React.createElement("span", { style: { color: change > 0 ? T.out : T.fresh, fontWeight: 600 } }, " ", change > 0 ? "+" : "", change, "% v\xF5rreldes eelmise kuuga")));
  }
  function RangeChips({ range, setRange }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 18 } }, [30, 90, 365, 0].map((r) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: r,
        onClick: () => setRange(r),
        style: {
          flex: 1,
          border: "none",
          borderRadius: 999,
          padding: "11px 0",
          fontSize: 13.5,
          fontWeight: range === r ? 700 : 500,
          fontFamily: FONT,
          cursor: "pointer",
          background: range === r ? T.raised : T.surface,
          color: range === r ? T.gold : T.faint
        }
      },
      r === 0 ? "K\xF5ik" : r === 365 ? "aasta" : `${r} p`
    )));
  }
  function StatsView({ data }) {
    const [range, setRange] = useState(90);
    const [openCat, setOpenCat] = useState(null);
    const [showPct, setShowPct] = useState(false);
    const cutoff = useMemo(() => {
      if (range === 0) return "0000-01-01";
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - range);
      return d.toISOString().slice(0, 10);
    }, [range]);
    const receipts = data.receipts.filter((r) => r.date >= cutoff);
    const lines = receipts.flatMap((r) => r.lines.map((l) => ({ ...l, store: r.store })));
    const total = receipts.reduce((a, b) => a + (b.total || 0), 0);
    const byCat = {};
    lines.forEach((l) => byCat[l.category] = (byCat[l.category] || 0) + l.total);
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const byStore = {};
    receipts.forEach((r) => {
      if (!byStore[r.store]) byStore[r.store] = { sum: 0, n: 0 };
      byStore[r.store].sum += r.total || 0;
      byStore[r.store].n += 1;
    });
    const stores = Object.entries(byStore).sort((a, b) => b[1].sum - a[1].sum);
    const byProduct = {};
    lines.forEach((l) => {
      const k = key(l.name);
      if (!byProduct[k]) byProduct[k] = { name: l.name, sum: 0, n: 0 };
      byProduct[k].sum += l.total;
      byProduct[k].n += 1;
    });
    const top = Object.values(byProduct).sort((a, b) => b.sum - a.sum).slice(0, 10);
    if (!receipts.length) {
      const all = data.receipts;
      const newest = all.length ? all.slice().sort((a, b) => b.date.localeCompare(a.date))[0] : null;
      return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, /* @__PURE__ */ React.createElement(RangeChips, { range, setRange }), newest ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Empty,
        {
          title: "Selles vahemikus kulusid pole",
          hint: `Sul on ${all.length} t\u0161ekki, aga k\xF5ik on vanemad. K\xF5ige v\xE4rskem on ${fmtDate(
            newest.date
          )}.`
        }
      ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: () => setRange(0) }, "N\xE4ita kogu ajalugu")) : /* @__PURE__ */ React.createElement(
        Empty,
        {
          title: "Kulusid pole veel",
          hint: "Kategooriad, poed ja tippkulutajad ilmuvad kohe p\xE4rast esimest t\u0161ekki. K\xE4sitsi m\xE4rgitud ostud siia ei j\xF5ua, sest neil pole hinda."
        }
      ));
    }
    const days = range || Math.max(daysBetween(receipts[0].date, today()), 1);
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, /* @__PURE__ */ React.createElement(RangeChips, { range, setRange }), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10, padding: "22px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginBottom: 18 } }, /* @__PURE__ */ React.createElement(
      Donut,
      {
        segments: cats.map(([c, v]) => [c, v, CAT_COLOR[c] || T.faint]),
        total,
        label: eur(total)
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [
      [receipts.length, "ostukorvi"],
      [eur(total / receipts.length), "korra kohta"],
      [eur(total / days * 30), "kuus"]
    ].map(([v, l]) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: l,
        style: {
          flex: 1,
          background: "#EEF2F7",
          borderRadius: 14,
          padding: "11px 6px",
          textAlign: "center"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600, ...num } }, v),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: T.faint, marginTop: 3 } }, l)
    ))), receipts.length < 3 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: T.faint, marginTop: 12, lineHeight: 1.5 } }, "Esialgne hinnang \u2014 p\xF5hineb alles ", receipts.length, " ", receipts.length === 1 ? "t\u0161ekil" : "t\u0161ekil", ". Muutub t\xE4psemaks iga uue t\u0161ekiga.")), /* @__PURE__ */ React.createElement(MonthBars, { receipts: data.receipts }), /* @__PURE__ */ React.createElement(MonthCalendar, { receipts: data.receipts }), /* @__PURE__ */ React.createElement(WeekdayBars, { receipts }), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10
        }
      },
      /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 0 } }, "Kategooria"),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowPct(true),
          style: {
            border: "none",
            background: "transparent",
            fontFamily: FONT,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: showPct ? 700 : 400,
            color: showPct ? T.gold : T.faint
          }
        },
        "%"
      ), /* @__PURE__ */ React.createElement("span", { style: { color: T.hair } }, "/"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowPct(false),
          style: {
            border: "none",
            background: "transparent",
            fontFamily: FONT,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: !showPct ? 700 : 400,
            color: !showPct ? T.gold : T.faint
          }
        },
        "Summa"
      ))
    ), cats.map(([c, v]) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c,
        onClick: () => setOpenCat(c),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 0",
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ React.createElement(CatIcon, { category: c, size: 34 }),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            flex: 1,
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        c,
        /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontSize: 12.5, color: T.faint, marginTop: 2 } }, showPct ? eur(v) : `${Math.round(v / total * 100)}% kuludest`)
      ),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 600, textAlign: "right", ...num } }, showPct ? `${Math.round(v / total * 100)}%` : eur(v)),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, color: T.faint, flexShrink: 0 } }, "\u203A")
    )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, paddingTop: 10, lineHeight: 1.5 } }, "Vajuta kategooriale, et n\xE4ha, mis tooted seal sees on.")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Poed"), stores.map(([s, v]) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: s,
        style: { display: "flex", justifyContent: "space-between", padding: "9px 0", gap: 10 }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5 } }, s, /* @__PURE__ */ React.createElement("span", { style: { color: T.faint, fontSize: 13 } }, " \xB7 ", v.n, " korda")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, ...num } }, eur(v.sum))
    ))), /* @__PURE__ */ React.createElement(Panel, null, /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 4 } }, "K\xFCmme suurimat kulutajat"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginBottom: 14, lineHeight: 1.5 } }, "Ostukordade arv \xFCllatab siin sagedamini kui summa"), top.map((p, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.name,
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "10px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            flex: 1,
            fontSize: 14.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        p.name
      ),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: T.faint, ...num } }, p.n, "\xD7"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, width: 74, textAlign: "right", ...num } }, eur(p.sum))
    ))), openCat && /* @__PURE__ */ React.createElement(
      CategorySheet,
      {
        category: openCat,
        lines: lines.filter((l) => l.category === openCat),
        total: byCat[openCat] || 0,
        share: total ? Math.round((byCat[openCat] || 0) / total * 100) : 0,
        onClose: () => setOpenCat(null)
      }
    ));
  }
  function CategorySheet({ category, lines, total, share, onClose }) {
    const byProduct = {};
    lines.forEach((l) => {
      const k = key(l.name);
      if (!byProduct[k]) byProduct[k] = { name: l.name, sum: 0, n: 0, qty: 0, unit: l.unit };
      byProduct[k].sum += l.total;
      byProduct[k].n += 1;
      byProduct[k].qty += l.qty || 0;
    });
    const items = Object.values(byProduct).sort((a, b) => b.sum - a.sum);
    const color = CAT_COLOR[category] || T.faint;
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 60 }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: 3, background: color } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em" } }, category)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.faint, marginBottom: 16 } }, eur(total), " \xB7 ", share, "% k\xF5igist kuludest \xB7 ", items.length, " eri toodet"), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 14 } }, items.map((p, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.name,
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "11px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        p.name
      ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 2 } }, p.n, "\xD7 ostetud \xB7 keskmiselt ", eur(p.sum / p.n), " korra kohta")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, ...num } }, eur(p.sum))
    ))), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sulge"));
  }
  function ProductsView({ products, onOpen }) {
    const [q, setQ] = useState("");
    const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (!products.length)
      return /* @__PURE__ */ React.createElement(
        Empty,
        {
          title: "Tooteid pole veel",
          hint: "Tooted tekivad ise t\u0161ekkidelt \u2014 k\xE4sitsi midagi lisama ei pea."
        }
      );
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: q,
        onChange: (e) => setQ(e.target.value),
        placeholder: "Otsi toodet",
        style: field({ width: "100%", marginBottom: 14, background: T.surface, boxSizing: "border-box" })
      }
    ), /* @__PURE__ */ React.createElement(Panel, { style: { padding: "6px 16px" } }, shown.map((p, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.k,
        onClick: () => onOpen(p),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "13px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`,
          cursor: "pointer",
          opacity: p.hidden ? 0.38 : 1
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { position: "relative", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(CatIcon, { category: p.category, size: 36 }), /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 11,
            height: 11,
            borderRadius: 6,
            background: statusColor(p.status),
            border: `2px solid ${T.surface}`
          }
        }
      )),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: 15.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        },
        p.name
      ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 2 } }, p.bag ? `${p.units} ${p.units === 1 ? "kott" : "kotti"} \xB7 ${p.count} poesk\xE4igul` : `${p.count}\xD7 \xB7 iga ${Math.round(p.est)} p\xE4eva tagant`)),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: T.soft, ...num } }, eur(p.spend))
    ))));
  }
  function ProductSheet({ p, data, save, onClose, onKeyChange }) {
    const [name, setName] = useState(p.name);
    useEffect(() => setName(p.name), [p.k]);
    const renamed = name.trim() && key(name) !== p.k;
    const priceChange = p.firstPrice && p.lastPrice && p.count > 1 && p.firstPrice !== p.lastPrice ? Math.round((p.lastPrice - p.firstPrice) / p.firstPrice * 100) : null;
    const c = progressColor(p.progress);
    return /* @__PURE__ */ React.createElement(Sheet, { onClose }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: name,
        onChange: (e) => setName(e.target.value),
        style: field({
          width: "100%",
          fontSize: 20,
          letterSpacing: "-0.015em",
          padding: "12px 13px",
          marginBottom: 8,
          background: T.surface,
          boxSizing: "border-box"
        })
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: p.category,
        onChange: (e) => save(setProductCategory(data, p.k, e.target.value)),
        style: field({ flex: 1, background: T.surface, fontSize: 14 })
      },
      CATEGORIES.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x))
    ), renamed && /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "solid",
        onClick: () => {
          save(renameProduct(data, p.k, name));
          onKeyChange(key(name));
        }
      },
      "Salvesta nimi"
    )), p.bag ? /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.6 } }, "Oled ostnud kokku ", p.units, " ", p.units === 1 ? "poekoti" : "poekotti", " ", p.count, " poesk\xE4igul ja maksnud nende eest", " ", eur(p.spend), ". Viimane ost ", fmtDate(p.lastDate), ", ", relDays(p.daysSincePurchase), "."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 10, lineHeight: 1.5 } }, "K\xF5ik kilekotid, paberkotid ja ostukotid liidetakse siia. Poekotti ostunimekirja ei ennustata.")) : /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          height: 10,
          borderRadius: 5,
          background: tint(T.ink, 0.06),
          overflow: "hidden",
          marginBottom: 16
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            width: `${Math.min(p.progress / 1.3, 1) * 100}%`,
            height: "100%",
            background: c,
            borderRadius: 5
          }
        }
      )
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.6 } }, "Ostad seda keskmiselt iga ", Math.round(p.est), " p\xE4eva tagant. Viimane ost", " ", fmtDate(p.lastDate), ", ", relDays(p.daysSincePurchase), ".", " ", p.status === "otsas" ? "Praeguse r\xFCtmi j\xE4rgi peaks otsas olema." : `Peaks j\xE4tkuma veel ${p.daysLeft} p\xE4evaks.`), !p.confident && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 10, lineHeight: 1.5 } }, "Toetub veel kategooria keskmisele. Paari ostu j\xE4rel muutub see sinu enda mustriks.")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, [
      ["Ostukordi", p.count],
      ["Kokku kulutatud", eur(p.spend)],
      p.lastPrice != null && [
        "Viimane \xFChikuhind",
        /* @__PURE__ */ React.createElement("span", { key: "pr" }, eur(p.lastPrice), priceChange != null && /* @__PURE__ */ React.createElement("span", { style: { color: priceChange > 0 ? T.out : T.fresh, marginLeft: 7 } }, priceChange > 0 ? "+" : "", priceChange, "%"))
      ]
    ].filter(Boolean).map(([k, v], i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: k,
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "9px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`,
          fontSize: 14.5
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { color: T.faint } }, k),
      /* @__PURE__ */ React.createElement("span", { style: num }, v)
    ))), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(Label, null, "Ostuajalugu"), p.purchases.slice().reverse().slice(0, 14).map((x, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
          fontSize: 14,
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: num }, fmtDate(x.date)),
      /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { color: T.faint, ...num } }, x.manual ? "m\xE4rgitud ostetuks" : `${x.qty} \xD7 ${eur(x.unitPrice || 0)}`), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => save(deletePurchase(data, x.src)),
          style: {
            border: "none",
            background: "transparent",
            color: T.out,
            fontSize: 13,
            fontFamily: FONT,
            cursor: "pointer",
            padding: 0
          }
        },
        "eemalda"
      ))
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      Btn,
      {
        style: { flex: 1 },
        onClick: () => {
          save({ ...data, hidden: { ...data.hidden, [p.k]: !p.hidden } });
          onClose();
        }
      },
      p.hidden ? "J\xE4lgi uuesti" : "\xC4ra j\xE4lgi seda"
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", onClick: onClose }, "Sulge")), /* @__PURE__ */ React.createElement(
      ConfirmBtn,
      {
        label: "Kustuta toode ja kogu ajalugu",
        confirmLabel: "Vajuta uuesti \u2014 kustutan",
        onConfirm: () => {
          save(deleteProduct(data, p.k));
          onClose();
        }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 10, lineHeight: 1.5 } }, "J\xE4lgimise l\xF5petamine j\xE4tab kulud statistikasse. Kustutamine eemaldab ka osturead t\u0161ekkidelt."));
  }
  const LOGO = "data:image/png;base64,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";
  const LOGO_FULL = "data:image/png;base64,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";
  function Wordmark({ height = 34 }) {
    return /* @__PURE__ */ React.createElement(
      "img",
      {
        src: LOGO,
        alt: "NeedMore",
        style: { height, width: "auto", display: "block" }
      }
    );
  }
  function GuideSheet({ onClose }) {
    const [faq, setFaq] = useState(false);
    const steps = [
      [
        "Loo pere-kood",
        "M\xF5tle koos pereliikmetega v\xE4lja \xFCks \xFChine kood ja sisestage see k\xF5igis telefonides. K\xF5ik, kes koodi teavad, n\xE4evad ja saavad muuta sama nimekirja \u2014 reaalajas, kontot pole selleks vaja."
      ],
      [
        "Lisa ost",
        "Ava \u201ET\u0161ekk\u201C, pildista kassat\u0161ekk v\xF5i vali pilt galeriist. Read loetakse ise sisse ja saad need enne salvestamist \xFCle vaadata. Ilma pildita saab ka: \u201Esisesta ost k\xE4sitsi\u201C."
      ],
      [
        "Nimekiri t\xE4ieneb iseenesest",
        "\xC4pp \xF5pib ostuajaloost, kui tihti iga toode kodus otsa saab, ja t\xF5stab selle \u201ENimekirja\u201C, kui aeg on k\xE4es. Sa ei pea ise midagi kirja panema \u2014 mida rohkem t\u0161ekke lisad, seda t\xE4psem ennustus on."
      ],
      [
        "Paranda, kui \xE4pp eksib",
        "Puuduta toodet. Kui seda on veel kodus, vajuta \u201EOn veel\u201C \u2014 intervall pikeneb. Sealtsamast saab nime ja kategooriat muuta v\xF5i j\xE4lgimise l\xF5petada."
      ],
      [
        "Retseptid ja N\xE4dalaplaan",
        "\u201EMinu retseptid\u201C all saad kirjutada, mida tahaksid s\xFC\xFCa (nt \u201Ekanakarri riisiga\u201C) ja mitmele inimesele. AI koostab retsepti koos kogustega ja \xE4pp \xFCtleb, mis peaks k\xFClmkapis juba olemas olema. Sinna saad kirja panna ka oma pere road. Retsepti avades vali, mitmele inimesele teed, ja \xE4pp arvutab kogused \xFCmber ning lisab puuduvad tooted ostunimekirja. \u201ERetseptisoovitused\u201C pakub AI abiga roogi sellest, mis kodus arvatavasti juba on, ja \u201EN\xE4dalaplaan\u201C aitab kogu n\xE4dala men\xFC\xFC ette planeerida."
      ],
      [
        "Kulud",
        "\u201EKulud\u201C vaade n\xE4itab, kuhu raha kuu l\xF5ikes l\xE4heb ja milliste kategooriate peale k\xF5ige rohkem kulub. Kalendris saad vajutada p\xE4evale, et n\xE4ha selle p\xE4eva t\u0161ekke ja tooteid."
      ],
      [
        "Minu konto",
        "Inimese-kujuline nupp \xFClal p\xE4ises avab ISIKLIKU konto (erineb pere-koodist). Sisse logides saad seadistada, millest ja millal \xE4pp teavitab."
      ]
    ];
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 80 }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 } }, /* @__PURE__ */ React.createElement(Wordmark, { height: 40 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, letterSpacing: "-0.015em" } }, "Kuidas kasutada"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 2 } }, "Ostunimekiri, mis \xF5pib sinu r\xFCtmi"))), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, steps.map(([title, body], i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: title,
        style: {
          display: "flex",
          gap: 13,
          padding: "12px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            width: 24,
            height: 24,
            borderRadius: 12,
            background: tint(T.gold, 0.15),
            color: T.gold,
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1
          }
        },
        i + 1
      ),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15.5, marginBottom: 4 } }, title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.soft, lineHeight: 1.55 } }, body))
    ))), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Label, null, "Lisa telefoni avaekraanile"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.soft, lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("strong", { style: { color: T.ink } }, "iPhone:"), " ava link Safaris, vajuta jagamisnuppu ja vali \u201ELisa avakuvale\u201C.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", { style: { color: T.ink } }, "Android:"), " ava link Chrome'is, ava men\xFC\xFC ja vali \u201EInstalli\u201C v\xF5i \u201ELisa avakuvale\u201C.")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFaq(true),
        style: {
          border: "none",
          background: "transparent",
          color: T.gold,
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          width: "100%",
          textAlign: "center",
          padding: "10px 0",
          marginBottom: 4
        }
      },
      "Korduma kippuvad k\xFCsimused (KKK)"
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sain aru"), faq && /* @__PURE__ */ React.createElement(FaqSheet, { onClose: () => setFaq(false) }));
  }
  function FaqSheet({ onClose }) {
    const [open, setOpen] = useState(0);
    const groups = [
      {
        label: "Nimekiri ja ennustus",
        items: [
          [
            "Kuidas \xE4pp teab, mis on kodus otsas?",
            "\xC4pp vaatab sinu ostuajalugu: kui tihti oled mingit toodet varem ostnud, arvutab keskmise \u201Ekestvuse\u201C ja n\xE4itab tootel riba, mis t\xE4itub selle aja jooksul. Kui riba j\xF5uab l\xF5puni, l\xE4heb toode \u201Eotsas\u201C olekusse ja t\xF5useb Nimekirja. Mida rohkem t\u0161ekke lisad, seda t\xE4psem ennustus on."
          ],
          [
            "Kust poodi mineja teab, kui palju osta?",
            "Iga toote all nimekirjas on kogus, nt \u201E3 tk\u201C. \xC4pp paneb sinna automaatselt koguse, mida olete t\u0161ekkide j\xE4rgi tavaliselt korraga ostnud. Seda saab muuta +/- nuppudega v\xF5i kirjutades lisamise kasti nt \u201EKodujuust 5\u201C, \u201E3x jogurt\u201C v\xF5i \u201EHakkliha 500 g\u201C. Muudetud kogus on kohe n\xE4ha k\xF5igil pereliikmetel, kes kasutavad sama pere-koodi. Korvi pannes l\xE4heb kogus kaasa ja p\xE4rast ostu algab j\xE4rgmine kord j\xE4lle tavalisest kogusest."
          ],
          [
            "Mis on nimekirja all olev \u201EVeel kodus\u201C?",
            "Seal on tooted, mis peaksid kodus veel j\xE4tkuma, aga on juba poole peal. \u201EJ\xE4tkub veel ~5 p\xE4eva\u201C n\xE4itab, mitu p\xE4eva toode \xE4pi hinnangul veel kestab. Tooted satuvad sinna ise t\u0161ekkide p\xF5hjal ja kui m\xF5ni hakkab otsa saama, t\xF5stab \xE4pp selle \xFCles nimekirja. Poekotti seal ei n\xE4idata."
          ],
          [
            "Miks \xE4pp arvab, et miski on otsas, kuigi seda on veel kodus?",
            "Puuduta toodet ja vajuta \u201EOn veel\u201C \u2014 see l\xFCkkab t\xE4htaega edasi ja \xE4pp \xF5pib, et see toode kestab tegelikult kauem kui seni arvatud."
          ],
          [
            "Kas kaks inimest saavad korraga nimekirja muuta?",
            "Jah. K\xF5ik samas pere-koodis muudatused j\xF5uavad k\xF5igi telefonidesse reaalajas kohale, kui interneti\xFChendus on olemas."
          ]
        ]
      },
      {
        label: "T\u0161ekid",
        items: [
          [
            "Kas t\u0161eki fotolt lugemine on t\xE4pne?",
            "T\u0161eki pilti loeb AI ja pakub read koos hindadega automaatselt valmis, aga need saab alati enne salvestamist \xFCle vaadata ja k\xE4sitsi parandada."
          ],
          [
            "Kas t\u0161ekki saab lisada ka ilma pildita?",
            "Jah, \u201ET\u0161ekk\u201C vaates on ka \u201Esisesta ost k\xE4sitsi\u201C v\xF5imalus."
          ]
        ]
      },
      {
        label: "Retseptid ja N\xE4dalaplaan",
        items: [
          [
            "Kuidas lasta AI-l retsept teha?",
            "Ava Retseptid \u2192 \u201EMinu retseptid\u201C. Kirjuta kasti \u201EMida tahaksid s\xFC\xFCa?\u201C oma soov (nt \u201Ekanakarri riisiga\u201C v\xF5i \u201Emidagi kiiret kalast\u201C), vali mitmele inimesele ja vajuta \u201EKoosta retsept\u201C. AI koostab retsepti koos kogustega. Rohelises kastis on kirjas, mis peaks k\xFClmkapis juba olemas olema. Puuduvad tooted on linnukesega m\xE4rgitud ja \u201ELisa nimekirja\u201C paneb need koos kogustega ostunimekirja. Retsept salvestub \u201EMinu retseptid\u201C alla ja seda saab muuta."
          ],
          [
            "Kuidas oma retsepti teha ja tooted nimekirja saada?",
            "Ava Retseptid \u2192 \u201EMinu retseptid\u201C \u2192 \u201ELoo retsept\u201C. Kirjuta roa nimi, mitmele inimesele retsept on ning koostisosad koguse ja \xFChikuga. Retsepti avades vali \u201ETeen \u2026 inimesele\u201C, m\xE4rgi tooted, mida on vaja osta, ja vajuta \u201ELisa nimekirja\u201C. Nimekirjas on n\xE4ha kogus ja mis roa jaoks toode on. Kui sama toode on juba nimekirjas, liidetakse kogused kokku."
          ],
          [
            "Mis vahe on Retseptidel ja N\xE4dalaplaanil?",
            "\u201ERetseptid\u201C pakub kohe AI roogi sellest, mida kodus arvatavasti on. \u201EN\xE4dalaplaan\u201C aitab kogu n\xE4dala peale ette m\xF5elda \u2014 iga p\xE4eva jaoks saab valida kas m\xF5ne pakutud retsepti v\xF5i kirjutada ise, mida s\xFC\xFCa."
          ]
        ]
      },
      {
        label: "Minu konto ja teavitused",
        items: [
          [
            "Kas pere-kood ja Minu konto on sama asi?",
            "Ei. Pere-kood on jagatud ostunimekiri (mitu inimest sama koodiga n\xE4evad sama nimekirja, kontot pole vaja). Minu konto on isiklik (e-post + parool) \u2014 iga inimene saab enda oma teha ja sealt seadistada teavitusi ning n\xE4ha oma paketti."
          ],
          [
            "Kas teavitused tulevad ka siis, kui \xE4pp on suletud?",
            "Praegu mitte t\xE4ielikult \u2014 teavitused t\xF6\xF6tavad k\xF5ige paremini, kui \xE4pp on hiljuti avatud olnud. P\xE4ris taustateavitused on \xFCks v\xF5imalik tulevane t\xE4iendus."
          ]
        ]
      },
      {
        label: "Andmed ja turvalisus",
        items: [
          [
            "Kuhu minu andmed salvestuvad ja kas need on turvalised?",
            "Pere andmed (nimekiri, t\u0161ekid) salvestuvad pilve teie pere-koodi taha. Isiklikud kontoandmed (e-post, teavituste eelistused, pakett) on omaette kohas, mida n\xE4eb ainult see, kes on selle kontoga sisse loginud."
          ],
          [
            "Mis juhtub, kui unustan pere-koodi?",
            "Kood on lihtsalt vabalt valitud tekst, mida keegi teine ei tea ilma sinu \xFCtlemata. Kui unustad selle, k\xFCsi m\xF5nelt pereliikmelt, kes juba nimekirja kasutab."
          ],
          [
            "Kas oma andmetest saab varukoopia teha?",
            "Jah \u2014 Seadete alt leiad \u201EVarunda faili\u201C (laeb k\xF5ik andmed \xFChte faili) ja \u201ETaasta failist\u201C, kui peaks vaja minema."
          ]
        ]
      }
    ];
    let flatIndex = -1;
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 90 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, letterSpacing: "-0.015em", marginBottom: 4 } }, "Korduma kippuvad k\xFCsimused"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginBottom: 18 } }, "Puuduta k\xFCsimust, et vastus avada"), groups.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.label, style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Label, null, g.label), /* @__PURE__ */ React.createElement(Panel, null, g.items.map(([q, a], i) => {
      flatIndex++;
      const idx = flatIndex;
      const isOpen = open === idx;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: q,
          style: {
            padding: "12px 0",
            borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            onClick: () => setOpen(isOpen ? -1 : idx),
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              cursor: "pointer"
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, fontWeight: 500 } }, q),
          /* @__PURE__ */ React.createElement("span", { style: { color: T.faint, fontSize: 16, flexShrink: 0 } }, isOpen ? "\u2212" : "+")
        ),
        isOpen && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.soft, lineHeight: 1.55, marginTop: 8 } }, a)
      );
    })))), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sulge"));
  }
  function MyRecipesList({ recipes, onNew, onOpen }) {
    if (!recipes.length)
      return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 600, marginBottom: 6 } }, "Teie pere road"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.faint, lineHeight: 1.55, marginBottom: 16 } }, "Kirjuta \xFCles road, mida teete tihti. Retsepti avades valid, mitmele inimesele s\xFC\xFCa teed. \xC4pp arvutab kogused \xFCmber ja lisab puuduvad tooted ostunimekirja."), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onNew }, "Loo retsept"));
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onNew, style: { marginBottom: 12 } }, "Loo retsept"), recipes.map((r) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r.id,
        onClick: () => onOpen(r),
        style: {
          background: T.surface,
          borderRadius: 14,
          padding: "15px 16px",
          marginBottom: 7,
          cursor: "pointer"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16.5, letterSpacing: "-0.01em" } }, r.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 4, ...num } }, r.serves, " inimesele \xB7 ", r.items.length, " koostisosa", r.ai ? " \xB7 AI koostatud" : "")
    )));
  }
  function RecipeWish({ household, homeNames, onCreated }) {
    const [wish, setWish] = useState("");
    const [people, setPeople] = useState(household);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const go = async () => {
      if (!wish.trim() || busy) return;
      setBusy(true);
      setError("");
      try {
        const r = await fetchWishRecipe(wish.trim(), people, homeNames);
        setWish("");
        onCreated(r);
      } catch (e) {
        setError(friendlyError(e));
      }
      setBusy(false);
    };
    return /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 600, marginBottom: 4 } }, "Mida tahaksid s\xFC\xFCa?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, lineHeight: 1.5, marginBottom: 12 } }, "Kirjuta oma soov ja AI koostab retsepti koos kogustega. N\xE4ed, mis peaks kodus juba olemas olema, ja saad puuduva lisada ostunimekirja."), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "nm-wish",
        value: wish,
        onChange: (e) => setWish(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && go(),
        placeholder: "nt kanakarri riisiga",
        style: field({ width: "100%", boxSizing: "border-box", marginBottom: 10 })
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5 } }, "Mitmele inimesele"),
      /* @__PURE__ */ React.createElement(QtyStepper, { value: people, onChange: setPeople, min: 1, max: 20 })
    ), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.out, marginBottom: 10, lineHeight: 1.5 } }, error), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: go, style: { opacity: wish.trim() || busy ? 1 : 0.6 } }, busy ? "Koostan retsepti\u2026" : "Koosta retsept"));
  }
  function MyRecipeEditor({ recipe, household, productNames, onSave, onDelete, onClose }) {
    const blankItem = () => ({ id: uid(), name: "", qty: "", unit: "g" });
    const [name, setName] = useState(recipe.name || "");
    const [serves, setServes] = useState(recipe.serves || household);
    const [items, setItems] = useState(
      recipe.items?.length ? recipe.items.map((i) => ({ ...i, id: uid(), qty: i.qty ? fmtNum(i.qty) : "" })) : [blankItem(), blankItem(), blankItem()]
    );
    const [stepsText, setStepsText] = useState((recipe.steps || []).join("\n"));
    const [error, setError] = useState("");
    const update = (id, patch) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));
    const submit = () => {
      const clean = items.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), qty: parseQty(i.qty), unit: i.unit }));
      if (!name.trim()) return setError("Anna retseptile nimi.");
      if (!clean.length) return setError("Lisa v\xE4hemalt \xFCks koostisosa.");
      onSave({
        ...recipe,
        id: recipe.id || uid(),
        name: name.trim(),
        serves,
        items: clean,
        steps: stepsText.split("\n").map((x) => x.trim()).filter(Boolean),
        createdAt: recipe.createdAt || today()
      });
    };
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 65 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 16 } }, recipe.id ? "Muuda retsepti" : "Uus retsept"), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "nm-recipe-name",
        value: name,
        onChange: (e) => setName(e.target.value),
        placeholder: "Roa nimi, nt Hakklihakaste",
        style: field({ width: "100%", marginBottom: 12, background: T.surface, boxSizing: "border-box" })
      }
    ), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15 } }, "Mitmele inimesele"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 2 } }, "Kogused on selle arvu jaoks")), /* @__PURE__ */ React.createElement(QtyStepper, { value: serves, onChange: setServes, min: 1, max: 20 })), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 8 } }, "Koostisosad"), /* @__PURE__ */ React.createElement("datalist", { id: "nm-product-names" }, productNames.map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }))), items.map((i, idx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i.id,
        style: {
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "7px 0",
          borderTop: idx === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      /* @__PURE__ */ React.createElement(
        "input",
        {
          id: `nm-ing-name-${i.id}`,
          value: i.name,
          onChange: (e) => update(i.id, { name: e.target.value }),
          placeholder: "Toode",
          list: "nm-product-names",
          style: field({ flex: "1 1 auto", minWidth: 0, padding: "10px 11px", fontSize: 14.5 })
        }
      ),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          id: `nm-ing-qty-${i.id}`,
          value: i.qty,
          onChange: (e) => update(i.id, { qty: e.target.value }),
          placeholder: "Kogus",
          inputMode: "decimal",
          style: field({ width: 64, flexShrink: 0, padding: "10px 9px", fontSize: 14.5, textAlign: "right", ...num })
        }
      ),
      /* @__PURE__ */ React.createElement(
        "select",
        {
          id: `nm-ing-unit-${i.id}`,
          value: i.unit,
          onChange: (e) => update(i.id, { unit: e.target.value }),
          style: field({ width: 66, flexShrink: 0, padding: "10px 8px", fontSize: 14.5 })
        },
        UNITS.map((u) => /* @__PURE__ */ React.createElement("option", { key: u, value: u }, u))
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          "aria-label": "Eemalda koostisosa",
          onClick: () => setItems(items.length > 1 ? items.filter((x) => x.id !== i.id) : [blankItem()]),
          style: {
            border: "none",
            background: "transparent",
            color: T.faint,
            fontSize: 18,
            cursor: "pointer",
            padding: "4px 2px",
            flexShrink: 0
          }
        },
        "\xD7"
      )
    )), /* @__PURE__ */ React.createElement(Btn, { kind: "quiet", full: true, style: { marginTop: 8 }, onClick: () => setItems([...items, blankItem()]) }, "+ Lisa koostisosa"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, lineHeight: 1.5, marginTop: 10 } }, "Kogus v\xF5ib j\xE4\xE4da t\xFChjaks (nt sool maitse j\xE4rgi). Kasuta toote nime nagu t\u0161ekil, siis teab \xE4pp, kas see on kodus olemas.")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 8 } }, "Valmistamine (soovi korral)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        id: "nm-recipe-steps",
        value: stepsText,
        onChange: (e) => setStepsText(e.target.value),
        placeholder: "Iga samm eraldi reale, nt\nPruunista hakkliha\nLisa sibul ja hauta 10 min",
        rows: 4,
        style: field({ width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 })
      }
    )), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.out, marginBottom: 10 } }, error), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "solid", style: { flex: 1 }, onClick: submit }, "Salvesta retsept"), /* @__PURE__ */ React.createElement(Btn, { onClick: onClose }, "Loobu")), onDelete && /* @__PURE__ */ React.createElement(ConfirmBtn, { label: "Kustuta retsept", confirmLabel: "Vajuta uuesti \u2014 kustutan", onConfirm: onDelete }));
  }
  function MyRecipeSheet({ r, data, save, classify, household, initialPeople, onEdit, onClose }) {
    const [people, setPeople] = useState(initialPeople || household);
    const factor = people / (r.serves || 1);
    const inList = (n) => data.extras.some((e) => key(e.name) === key(n));
    const [picked, setPicked] = useState(
      () => r.items.map((i) => classify(i.name) === "missing" && !inList(i.name))
    );
    const [added, setAdded] = useState(0);
    const STATE = {
      have: { color: T.fresh, label: "kodus olemas" },
      staple: { color: T.soon, label: "eeldan et on olemas" },
      missing: { color: T.soon, label: "vaja osta" }
    };
    const count = picked.filter(Boolean).length;
    const addToList = () => {
      let extras = [...data.extras];
      r.items.forEach((i, idx) => {
        if (!picked[idx]) return;
        const amount = scaleAmount(i, factor);
        const at = extras.findIndex((e) => key(e.name) === key(i.name));
        if (at === -1) {
          extras.push({ id: uid(), name: i.name, amounts: amount ? [toBase(amount)] : [], from: [r.name] });
        } else {
          const e = extras[at];
          extras[at] = {
            ...e,
            amounts: amount ? mergeAmounts(e.amounts, amount) : e.amounts || [],
            from: [.../* @__PURE__ */ new Set([...e.from || [], r.name])]
          };
        }
      });
      save({ ...data, extras });
      setAdded(count);
      setPicked(picked.map(() => false));
    };
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 60 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 } }, r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, marginBottom: 14 } }, r.blurb ? `${r.blurb} ` : "", r.ai ? "AI koostas retsepti" : "Retsept on kirjutatud", " ", r.serves, " inimesele", r.minutes ? ` \xB7 ${r.minutes} min` : ""), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15 } }, "Teen"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(QtyStepper, { value: people, onChange: (n) => (setPeople(n), setAdded(0)), min: 1, max: 20 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, "inimesele"))), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 6 } }, "Koostisosad ", people, " inimesele"), (() => {
      const home = r.items.filter((i) => classify(i.name) === "have").map((i) => i.name);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontSize: 13.5,
            lineHeight: 1.5,
            marginBottom: 6,
            padding: "10px 12px",
            borderRadius: 12,
            background: home.length ? tint(T.fresh, 0.1) : T.raised,
            color: home.length ? T.fresh : T.soft
          }
        },
        home.length ? `K\xFClmkapis peaks juba olemas olema: ${home.join(", ")}. Neid ei m\xE4rgitud ostmiseks, aga v\xF5id linnukese panna, kui on vaja juurde.` : "\xC4pi teada pole \xFChtegi koostisosa kodus. M\xE4rgitud tooted l\xE4hevad nimekirja."
      );
    })(), r.items.map((i, idx) => {
      const state = classify(i.name);
      const st = STATE[state];
      const listed = inList(i.name);
      const amount = scaleAmount(i, factor);
      return /* @__PURE__ */ React.createElement(
        "label",
        {
          key: idx,
          htmlFor: `nm-pick-${r.id}-${idx}`,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "11px 0",
            borderTop: idx === 0 ? "none" : `1px solid ${T.hair}`,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement(
          "input",
          {
            id: `nm-pick-${r.id}-${idx}`,
            type: "checkbox",
            checked: !!picked[idx],
            onChange: (e) => {
              setPicked(picked.map((v, j) => j === idx ? e.target.checked : v));
              setAdded(0);
            },
            style: { width: 20, height: 20, accentColor: T.gold, flexShrink: 0, margin: 0 }
          }
        ),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15 } }, i.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: listed ? T.fresh : st.color, marginTop: 2 } }, listed ? "nimekirjas" : st.label)),
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: T.soft, whiteSpace: "nowrap", ...num } }, amount ? fmtAmount(amount) : "maitse j\xE4rgi")
      );
    }), /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: count ? "solid" : "quiet",
        full: true,
        style: { marginTop: 12, opacity: count ? 1 : 0.6 },
        onClick: () => count && addToList()
      },
      count ? `Lisa ${count} ${count === 1 ? "toode" : "toodet"} nimekirja` : added ? `${added} ${added === 1 ? "toode" : "toodet"} lisatud nimekirja \u2713` : "M\xE4rgi tooted, mida on vaja osta"
    )), r.steps?.length > 0 && /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Valmistamine"), r.steps.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: "9px 0" } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          width: 22,
          height: 22,
          borderRadius: 11,
          background: tint(T.gold, 0.15),
          color: T.gold,
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1
        }
      },
      i + 1
    ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, lineHeight: 1.6 } }, s)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { style: { flex: 1 }, onClick: () => onEdit(r) }, "Muuda retsepti"), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", style: { flex: 1 }, onClick: onClose }, "Sulge")));
  }
  function RecipesView({ data, save, products }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(null);
    const [subTab, setSubTab] = useState("mine");
    const [openMine, setOpenMine] = useState(null);
    const [openPeople, setOpenPeople] = useState(null);
    const [editing, setEditing] = useState(null);
    const myRecipes = data.myRecipes || [];
    const household = data.settings?.household || 2;
    const inStock = products.filter((p) => !p.hidden && !p.bag && p.progress < 1).sort((a, b) => a.progress - b.progress).slice(0, 30);
    const stored = data.recipes;
    const openRecipe = open ? stored?.list?.find((x) => x.id === open.id) : null;
    const generate = async () => {
      setBusy(true);
      setError("");
      try {
        const list = await fetchRecipes(inStock.map((p) => p.name), household);
        save({ ...data, recipes: { at: today(), list } });
      } catch (e) {
        setError(friendlyError(e));
      }
      setBusy(false);
    };
    const classify = (ing) => {
      if (isStaple(ing)) return "staple";
      const n = ing.toLowerCase();
      const own = inStock.some((p) => n.includes(p.k) || p.k.includes(n.split(" ")[0]));
      return own ? "have" : "missing";
    };
    const subTabChip = (on) => ({
      border: "none",
      borderRadius: 999,
      padding: "9px 15px",
      fontSize: 13,
      fontFamily: FONT,
      fontWeight: on ? 700 : 500,
      cursor: "pointer",
      background: on ? tint(T.gold, 0.16) : T.raised,
      color: on ? T.gold : T.soft
    });
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "0 14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSubTab("mine"), style: subTabChip(subTab === "mine") }, "Minu retseptid"), /* @__PURE__ */ React.createElement("button", { onClick: () => setSubTab("recipes"), style: subTabChip(subTab === "recipes") }, "Retseptisoovitused"), /* @__PURE__ */ React.createElement("button", { onClick: () => setSubTab("plan"), style: subTabChip(subTab === "plan") }, "N\xE4dalaplaan")), subTab === "mine" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      RecipeWish,
      {
        household,
        homeNames: inStock.map((p) => p.name),
        onCreated: (r) => {
          save({ ...data, myRecipes: [r, ...myRecipes] });
          setOpenPeople(r.serves);
          setOpenMine(r.id);
        }
      }
    ), /* @__PURE__ */ React.createElement(
      MyRecipesList,
      {
        recipes: myRecipes,
        onNew: () => setEditing({}),
        onOpen: (r) => {
          setOpenPeople(null);
          setOpenMine(r.id);
        }
      }
    )), subTab === "plan" && /* @__PURE__ */ React.createElement(
      MealPlanner,
      {
        data,
        save,
        recipes: [...stored?.list || [], ...myRecipes.map((r) => ({ ...r, mine: true }))],
        onOpenRecipe: (r) => r.mine ? setOpenMine(r.id) : setOpen(r)
      }
    ), subTab === "recipes" && inStock.length < 3 && /* @__PURE__ */ React.createElement(
      Empty,
      {
        title: "Liiga v\xE4he teadaolevat kraami",
        hint: `\xC4pp n\xE4eb praegu ${inStock.length} toodet, mis peaks kodus olema. Lisa paar t\u0161ekki \u2014 kui midagi on ostetud ammu, arvab \xE4pp, et see on juba otsas, ja j\xE4tab retseptidest v\xE4lja.`
      }
    ), subTab === "recipes" && inStock.length >= 3 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, lineHeight: 1.55, marginBottom: 14 } }, "Kodus peaks praegu olema ", inStock.length, " toodet. Pakun neist rooga", " ", household, " inimesele."), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: generate }, busy ? "M\xF5tlen\u2026" : stored ? "Paku uued road" : "Paku roogi")), error && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          background: tint(T.out, 0.12),
          borderRadius: 12,
          padding: "13px 15px",
          fontSize: 14,
          color: T.out,
          marginBottom: 12
        }
      },
      error
    ), busy && [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          height: 78,
          borderRadius: 14,
          background: T.surface,
          marginBottom: 7,
          animation: `pulse 1.4s ease-in-out ${i * 0.18}s infinite`
        }
      }
    )), !busy && stored?.list?.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Label, null, "Koostatud ", fmtDate(stored.at)), stored.list.map((r) => {
      const missing = r.items.filter((i) => classify(i.name) === "missing");
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: r.id,
          onClick: () => setOpen(r),
          style: {
            background: T.surface,
            borderRadius: 14,
            padding: "15px 16px",
            marginBottom: 7,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "baseline"
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16.5, letterSpacing: "-0.01em" } }, r.name),
          r.minutes && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: T.faint, flexShrink: 0, ...num } }, r.minutes, " min", r.macros ? ` \xB7 ${r.macros.kcal} kcal${r.macros.per100 ? "/100 g" : ""}` : "")
        ),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, marginTop: 5, lineHeight: 1.5 } }, r.blurb),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              fontSize: 13,
              marginTop: 9,
              color: missing.length ? T.soon : T.fresh
            }
          },
          missing.length ? `Juurde vaja: ${missing.map((m) => m.name).join(", ")}` : "K\xF5ik peaks kodus olemas olema"
        )
      );
    }))), openRecipe && /* @__PURE__ */ React.createElement(
      RecipeSheet,
      {
        r: openRecipe,
        classify,
        inList: (n) => data.extras.some((e) => key(e.name) === key(n)),
        onAdd: (names) => save({
          ...data,
          extras: [
            ...data.extras,
            ...names.filter((n) => !data.extras.some((e) => key(e.name) === key(n))).map((n) => ({ id: uid(), name: n }))
          ]
        }),
        onRemove: (n) => save({
          ...data,
          extras: data.extras.filter((e) => key(e.name) !== key(n))
        }),
        household,
        onDetail: (id, detail) => save({
          ...data,
          recipes: {
            ...stored,
            list: stored.list.map((x) => x.id === id ? { ...x, detail } : x)
          }
        }),
        onClose: () => setOpen(null)
      }
    ), openMine && myRecipes.find((r) => r.id === openMine) && /* @__PURE__ */ React.createElement(
      MyRecipeSheet,
      {
        r: myRecipes.find((r) => r.id === openMine),
        data,
        save,
        classify,
        household,
        initialPeople: openPeople,
        onEdit: (r) => {
          setOpenMine(null);
          setEditing(r);
        },
        onClose: () => setOpenMine(null)
      }
    ), editing && /* @__PURE__ */ React.createElement(
      MyRecipeEditor,
      {
        recipe: editing,
        household,
        productNames: products.filter((p) => !p.bag).map((p) => p.name),
        onSave: (r) => {
          const exists = myRecipes.some((x) => x.id === r.id);
          save({
            ...data,
            myRecipes: exists ? myRecipes.map((x) => x.id === r.id ? r : x) : [...myRecipes, r]
          });
          setEditing(null);
          setOpenMine(r.id);
        },
        onDelete: editing.id ? () => {
          save({ ...data, myRecipes: myRecipes.filter((x) => x.id !== editing.id) });
          setEditing(null);
        } : null,
        onClose: () => setEditing(null)
      }
    ));
  }
  const FULL_WEEKDAY_NAMES = ["Esmasp\xE4ev", "Teisip\xE4ev", "Kolmap\xE4ev", "Neljap\xE4ev", "Reede", "Laup\xE4ev", "P\xFChap\xE4ev"];
  const shortDate = (iso) => {
    const [, m, d] = iso.split("-");
    return `${Number(d)}.${Number(m)}`;
  };
  function MealPlanner({ data, save, recipes, onOpenRecipe }) {
    const [off, setOff] = useState(0);
    const [picking, setPicking] = useState(null);
    const [customText, setCustomText] = useState("");
    const mealPlan = data.mealPlan || {};
    const monday = (() => {
      const d = /* @__PURE__ */ new Date();
      const dow = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - dow + off * 7);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const days = FULL_WEEKDAY_NAMES.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const date = localISO(d);
      return { date, label, isToday: date === today() };
    });
    const setMeal = (date, meal) => {
      save({ ...data, mealPlan: { ...mealPlan, [date]: meal } });
      setPicking(null);
      setCustomText("");
    };
    const clearMeal = (date) => {
      const next = { ...mealPlan };
      delete next[date];
      save({ ...data, mealPlan: next });
    };
    const pickingDay = days.find((d) => d.date === picking);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOff(off - 1), style: weekNavBtn }, "\u2039"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, ...num } }, shortDate(days[0].date), " \u2013 ", shortDate(days[6].date), off === 0 && /* @__PURE__ */ React.createElement("span", { style: { color: T.gold, fontWeight: 600 } }, " \xB7 praegu")), /* @__PURE__ */ React.createElement("button", { onClick: () => setOff(off + 1), style: weekNavBtn }, "\u203A")), days.map((d) => {
      const meal = mealPlan[d.date];
      const recipe = meal?.id ? recipes.find((r) => r.id === meal.id) : null;
      const clickable = !!recipe;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: d.date,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: T.surface,
            borderRadius: 14,
            padding: "12px 14px",
            marginBottom: 7,
            boxShadow: d.isToday ? `inset 3px 0 0 ${T.gold}` : "none"
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 78, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: d.isToday ? 700 : 500 } }, d.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: T.faint, marginTop: 1, ...num } }, shortDate(d.date))),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            onClick: () => meal ? clickable && onOpenRecipe(recipe) : setPicking(d.date),
            style: { flex: 1, minWidth: 0, cursor: meal ? clickable ? "pointer" : "default" : "pointer" }
          },
          meal ? /* @__PURE__ */ React.createElement(
            "span",
            {
              style: {
                fontSize: 14.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block"
              }
            },
            meal.name
          ) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: T.faint } }, "+ Lisa toit")
        ),
        meal && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => clearMeal(d.date),
            "aria-label": "Eemalda",
            style: {
              border: "none",
              background: "transparent",
              color: T.faint,
              fontSize: 18,
              cursor: "pointer",
              padding: "6px 4px",
              flexShrink: 0
            }
          },
          "\xD7"
        )
      );
    }), picking && /* @__PURE__ */ React.createElement(Sheet, { onClose: () => setPicking(null), z: 65 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 19, letterSpacing: "-0.01em", marginBottom: 4 } }, "Mida s\xFC\xFCa ", pickingDay?.label.toLowerCase(), "?"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginBottom: 16 } }, shortDate(picking)), recipes.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(Label, null, "Valmis retseptidest"), recipes.map((r) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r.id,
        onClick: () => setMeal(picking, { id: r.id, name: r.name }),
        style: {
          background: T.surface,
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 6,
          cursor: "pointer",
          fontSize: 14.5
        }
      },
      r.name
    ))), /* @__PURE__ */ React.createElement(Label, null, "V\xF5i kirjuta ise"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: customText,
        onChange: (e) => setCustomText(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && customText.trim() && setMeal(picking, { name: customText.trim() }),
        placeholder: "nt Kanasalat",
        autoFocus: true,
        style: field({ flex: 1, background: "#EEF2F7" })
      }
    ), /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "solid",
        onClick: () => customText.trim() && setMeal(picking, { name: customText.trim() })
      },
      "Lisa"
    ))));
  }
  const weekNavBtn = {
    border: "none",
    background: T.raised,
    color: T.gold,
    borderRadius: 999,
    width: 32,
    height: 32,
    fontSize: 16,
    fontFamily: FONT,
    cursor: "pointer"
  };
  function RecipeSheet({ r, classify, inList, onAdd, onRemove, onClose, household, onDetail }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const missing = r.items.filter((i) => classify(i.name) === "missing");
    const toAdd = missing.filter((i) => !inList(i.name));
    const STATE = {
      have: { color: T.fresh, label: "kodus olemas", action: false },
      staple: { color: T.soon, label: "eeldan et on olemas", action: true },
      missing: { color: T.soon, label: "vaja osta", action: true }
    };
    useEffect(() => {
      if (r.detail || busy) return;
      let alive = true;
      setBusy(true);
      fetchRecipeDetail(r, household).then((d) => alive && onDetail(r.id, d)).catch((e) => alive && setError(friendlyError(e))).finally(() => alive && setBusy(false));
      return () => {
        alive = false;
      };
    }, [r.id]);
    const steps = r.detail?.steps?.length ? r.detail.steps : r.steps;
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 60 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 } }, r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.faint, marginBottom: 16, lineHeight: 1.5 } }, r.blurb, r.minutes ? ` \xB7 ${r.minutes} min` : ""), /* @__PURE__ */ React.createElement(MacroPanel, { m: r.macros, household }), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, { style: { marginBottom: 6 } }, "Koostisosad"), r.items.map((i, idx) => {
      const state = classify(i.name);
      const st = STATE[state];
      const added = inList(i.name);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "11px 0",
            borderTop: idx === 0 ? "none" : `1px solid ${T.hair}`
          }
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              width: 8,
              height: 8,
              borderRadius: 4,
              background: st.color,
              flexShrink: 0
            }
          }
        ),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15 } }, i.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: added ? T.fresh : st.color, marginTop: 2 } }, added ? "nimekirjas" : st.label)),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              fontSize: 13,
              color: T.faint,
              flexShrink: 1,
              minWidth: 0,
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...num
            }
          },
          i.amount
        ),
        st.action && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => added ? onRemove(i.name) : onAdd([i.name]),
            style: {
              border: "none",
              borderRadius: 999,
              flexShrink: 0,
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: FONT,
              padding: "7px 11px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: added ? tint(T.fresh, 0.13) : "#EEF2F7",
              color: added ? T.fresh : T.ink
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, lineHeight: 1 } }, added ? "\u2713" : "+"),
          added ? "korvis" : "korvi"
        )
      );
    })), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Valmistamine"), steps.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: "9px 0" } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          width: 22,
          height: 22,
          borderRadius: 11,
          background: tint(T.gold, 0.15),
          color: T.gold,
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1
        }
      },
      i + 1
    ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14.5, lineHeight: 1.6 } }, s))), busy && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, paddingTop: 10 } }, "Toon p\xF5hjalikuma juhendi\u2026"), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.out, paddingTop: 10, lineHeight: 1.5 } }, error)), r.detail?.tips?.length > 0 && /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Hea teada"), r.detail.tips.map((t, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        style: {
          fontSize: 14,
          color: T.soft,
          lineHeight: 1.6,
          padding: "8px 0",
          borderTop: i === 0 ? "none" : `1px solid ${T.hair}`
        }
      },
      t
    ))), toAdd.length > 0 && /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: "solid",
        full: true,
        style: { marginBottom: 8 },
        onClick: () => onAdd(toAdd.map((m) => m.name))
      },
      "Lisa k\xF5ik ",
      toAdd.length,
      " puuduvat nimekirja"
    ), /* @__PURE__ */ React.createElement(Btn, { full: true, style: { marginBottom: 8 }, onClick: () => downloadRecipe(r, household) }, "Laadi retsept PDF-ina"), /* @__PURE__ */ React.createElement(Btn, { kind: "bare", full: true, onClick: onClose }, "Sulge"));
  }
  function SettingsSheet({ data, save, onClose, household, onLeaveHousehold }) {
    const s = data.settings || { mode: "daily", days: [] };
    const [msg, setMsg] = useState("");
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [pendingRestore, setPendingRestore] = useState(null);
    const shop = nextShop(s);
    useEffect(() => {
      if (!confirmLeave) return;
      const t = setTimeout(() => setConfirmLeave(false), 4e3);
      return () => clearTimeout(t);
    }, [confirmLeave]);
    const setMode = (mode) => save({
      ...data,
      settings: {
        mode,
        days: mode === "daily" ? [] : s.days.length ? s.days : [6]
      }
    });
    const toggleDay = (n) => {
      let days;
      if (s.mode === "weekly") days = [n];
      else days = s.days.includes(n) ? s.days.filter((x) => x !== n) : [...s.days, n];
      if (days.length === 0) days = [n];
      save({ ...data, settings: { ...s, days } });
    };
    const exportData = () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ostuandmed-${today()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4e3);
      setMsg("Fail salvestatud.");
    };
    const pickRestoreFile = async (file) => {
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed.receipts)) throw new Error("vale fail");
        setPendingRestore(parsed);
        setMsg("");
      } catch (e) {
        setMsg("See fail ei ole selle \xE4pi varundus.");
      }
    };
    const confirmRestore = () => {
      if (!pendingRestore) return;
      save({ ...emptyData, ...pendingRestore });
      setMsg(`Taastatud: ${pendingRestore.receipts.length} t\u0161ekki.`);
      setPendingRestore(null);
    };
    const modes = [
      ["daily", "Iga p\xE4ev"],
      ["weekly", "Kord n\xE4dalas"],
      ["days", "Valitud p\xE4evad"]
    ];
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 70 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 16 } }, "Seaded"), household && /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Pere-kood"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600 } }, household), onLeaveHousehold && /* @__PURE__ */ React.createElement(
      Btn,
      {
        kind: confirmLeave ? "warn" : "quiet",
        style: { padding: "8px 14px", fontSize: 13 },
        onClick: () => confirmLeave ? onLeaveHousehold() : setConfirmLeave(true)
      },
      confirmLeave ? "Kindel? Vajuta uuesti" : "Vaheta kood"
    )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 10, lineHeight: 1.5 } }, "Sama koodi kasutavad pereliikmed n\xE4evad sama nimekirja. Koodi vahetamine avab teise pere nimekirja \u2014 sinu andmed j\xE4\xE4vad selle koodi alla alles.")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Kui tihti poes k\xE4id"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: s.mode === "daily" ? 0 : 14 } }, modes.map(([m, label]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m,
        onClick: () => setMode(m),
        style: {
          flex: 1,
          border: "none",
          borderRadius: 999,
          padding: "9px 0",
          fontSize: 13,
          fontFamily: FONT,
          cursor: "pointer",
          background: s.mode === m ? tint(T.gold, 0.16) : T.raised,
          color: s.mode === m ? T.gold : T.soft
        }
      },
      label
    ))), s.mode !== "daily" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "space-between" } }, WEEKDAYS.map((w) => {
      const on = s.days.includes(w.n);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: w.n,
          onClick: () => toggleDay(w.n),
          style: {
            flex: 1,
            aspectRatio: "1",
            border: "none",
            borderRadius: 999,
            fontSize: 14,
            fontFamily: FONT,
            fontWeight: on ? 600 : 400,
            cursor: "pointer",
            background: on ? tint(T.gold, 0.16) : T.raised,
            color: on ? T.gold : T.faint
          }
        },
        w.short
      );
    })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, marginTop: 14, lineHeight: 1.55 } }, shop.days === 0 ? "Nimekiri n\xE4itab, mis on otsas praegu." : `J\xE4rgmine poesk\xE4ik ${shop.label}. Nimekiri n\xE4itab, mis on selleks ajaks otsas \u2014 ka see, mis praegu veel j\xE4tkub.`)), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Mitu inimest peres"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, [1, 2, 3, 4, 5, 6].map((n) => {
      const on = (s.household || 2) === n;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: n,
          onClick: () => save({ ...data, settings: { ...s, household: n } }),
          style: {
            flex: 1,
            aspectRatio: "1",
            border: "none",
            borderRadius: 999,
            fontSize: 15,
            fontFamily: FONT,
            fontWeight: on ? 600 : 400,
            cursor: "pointer",
            background: on ? tint(T.gold, 0.16) : T.raised,
            color: on ? T.gold : T.faint
          }
        },
        n === 6 ? "6+" : n
      );
    })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, marginTop: 12, lineHeight: 1.55 } }, "Retseptide kogused arvutatakse selle j\xE4rgi.")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Andmed"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { style: { flex: 1 }, onClick: exportData }, "Varunda faili"), /* @__PURE__ */ React.createElement(
      "label",
      {
        style: {
          position: "relative",
          flex: 1,
          display: "inline-block",
          textAlign: "center",
          background: tint(T.ink, 0.06),
          color: T.ink,
          borderRadius: 999,
          padding: "10px 0",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer"
        }
      },
      "Taasta failist",
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "file",
          accept: "application/json,.json",
          onChange: (e) => pickRestoreFile(e.target.files?.[0]),
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer"
          }
        }
      )
    )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 12, lineHeight: 1.55 } }, "Taastamine asendab k\xF5ik praegused andmed failis olevatega.", msg && /* @__PURE__ */ React.createElement("span", { style: { color: T.ink, display: "block", marginTop: 6 } }, msg)), pendingRestore && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          marginTop: 12,
          padding: "12px 13px",
          borderRadius: 14,
          background: tint(T.out, 0.1)
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginBottom: 10 } }, "Failis on ", /* @__PURE__ */ React.createElement("strong", null, pendingRestore.receipts.length, " t\u0161ekki"), ". See", /* @__PURE__ */ React.createElement("strong", null, " kustutab ja asendab k\xF5ik"), " praegused andmed selle koodi all \u2014 kaasa arvatud k\xF5ik, mida pereliige on hiljem lisanud. Kas oled kindel?"),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
        Btn,
        {
          kind: "bare",
          style: { flex: 1 },
          onClick: () => setPendingRestore(null)
        },
        "Loobu"
      ), /* @__PURE__ */ React.createElement(Btn, { kind: "warn", style: { flex: 1 }, onClick: confirmRestore }, "Jah, asenda andmed"))
    )), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sulge"));
  }
  function AccountSheet({ acc, onClose }) {
    const { hasAuth, authUser, authReady, profile, profileLoaded, authError, authBusy, saveProfile, signUp, signIn, signOutUser } = acc;
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [notifPerm, setNotifPerm] = useState(
      typeof Notification !== "undefined" ? Notification.permission : "unsupported"
    );
    const submit = () => {
      if (!email.trim() || password.length < 6) return;
      if (mode === "signup") signUp(email.trim(), password);
      else signIn(email.trim(), password);
    };
    const requestNotif = async () => {
      if (typeof Notification === "undefined") return;
      try {
        const res = await Notification.requestPermission();
        setNotifPerm(res);
        if (res === "granted") saveProfile({ notifications: { ...profile?.notifications || {}, enabled: true } });
      } catch (e) {
      }
    };
    const toggleCategory = (cat) => {
      const cats = { ...profile?.notifications?.categories || {} };
      cats[cat] = cats[cat] === false ? true : false;
      saveProfile({ notifications: { ...profile?.notifications || {}, categories: cats } });
    };
    if (!hasAuth)
      return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 70 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 16 } }, "Minu konto"), /* @__PURE__ */ React.createElement(
        Empty,
        {
          title: "Konto vajab veebi-seadistust",
          hint: "Isiklik konto (teavitused) t\xF6\xF6tab p\xE4rast seda, kui \xE4pp on Firebase'iga veebi \xFCles seatud \u2014 praegu jookseb prooviversioon ainult selles seadmes."
        }
      ), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose, style: { marginTop: 14 } }, "Sulge"));
    if (!authReady || authUser && !profileLoaded)
      return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 70 }, /* @__PURE__ */ React.createElement("div", { style: { padding: "30px 0", textAlign: "center", color: T.faint, fontSize: 14 } }, "Laen\u2026"));
    if (!authUser)
      return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 70 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 4 } }, mode === "signup" ? "Loo konto" : "Logi sisse"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, lineHeight: 1.55, marginBottom: 16 } }, "Konto on eraldiseisev teie pere ostunimekirjast \u2014 see on iga\xFChe enda jaoks, et seadistada teavitusi ja n\xE4ha oma paketti. Ostunimekirja kasutamiseks pole kontot vaja."), /* @__PURE__ */ React.createElement(Panel, { style: { padding: "18px 16px" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: "e-post",
          type: "email",
          autoCapitalize: "none",
          autoCorrect: "off",
          style: field({ width: "100%", background: "#EEF2F7", marginBottom: 8, boxSizing: "border-box" })
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          value: password,
          onChange: (e) => setPassword(e.target.value),
          placeholder: "parool (v\xE4hemalt 6 t\xE4hem\xE4rki)",
          type: "password",
          onKeyDown: (e) => e.key === "Enter" && submit(),
          style: field({ width: "100%", background: "#EEF2F7", marginBottom: 10, boxSizing: "border-box" })
        }
      ), authError && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.out, marginBottom: 10, lineHeight: 1.5 } }, authError), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, style: { opacity: authBusy ? 0.6 : 1 }, onClick: submit }, authBusy ? "Palun oota\u2026" : mode === "signup" ? "Loo konto" : "Logi sisse"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setMode(mode === "signup" ? "signin" : "signup"),
          style: {
            border: "none",
            background: "transparent",
            color: T.gold,
            fontFamily: FONT,
            fontSize: 13,
            cursor: "pointer",
            marginTop: 12,
            width: "100%",
            textAlign: "center"
          }
        },
        mode === "signup" ? "Mul on juba konto \u2014 logi sisse" : "Pole veel kontot? Loo \xFCks"
      )), /* @__PURE__ */ React.createElement(Btn, { kind: "bare", full: true, style: { marginTop: 10 }, onClick: onClose }, "J\xE4tka ilma kontota"));
    const notifPrefs = profile?.notifications || { enabled: false, categories: {} };
    return /* @__PURE__ */ React.createElement(Sheet, { onClose, z: 70 }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 21, letterSpacing: "-0.015em", marginBottom: 16 } }, "Minu konto"), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Konto"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 12 } }, authUser.email), !authUser.emailVerified && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, lineHeight: 1.5, marginBottom: 12 } }, "Saatsime sulle kinnituskirja \u2014 palun kontrolli oma postkasti (ka r\xE4mpsposti kausta)."), /* @__PURE__ */ React.createElement(Btn, { full: true, onClick: signOutUser }, "Logi v\xE4lja")), /* @__PURE__ */ React.createElement(Panel, { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Label, null, "Teavitused"), notifPerm === "unsupported" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, lineHeight: 1.5 } }, "See brauser ei toeta teavitusi.") : notifPerm === "denied" ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: T.faint, lineHeight: 1.5 } }, "Teavitused on brauseri tasandil blokeeritud. Luba need brauseri/telefoni seadetest saidi jaoks, et siin sisse l\xFClitada.") : !notifPrefs.enabled || notifPerm !== "granted" ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: T.faint, lineHeight: 1.5, marginBottom: 12 } }, 'Saad teada, kui m\xF5ni toode l\xE4heb "otsas" olekusse \u2014 nii ei pea ise nimekirja kontrollima k\xE4ima. T\xF6\xF6tab k\xF5ige paremini siis, kui \xE4pp on hiljuti avatud olnud.'), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: requestNotif }, "Luba teavitused")) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5 } }, "Teavitused on lubatud"),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => saveProfile({ notifications: { ...notifPrefs, enabled: false } }),
          style: { border: "none", background: "transparent", color: T.out, fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }
        },
        "L\xFClita v\xE4lja"
      )
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: T.faint, marginBottom: 8 } }, "Millistest kategooriatest teada anda:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, Object.keys(CAT_COLOR).map((cat) => {
      const on = notifPrefs.categories?.[cat] !== false;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: cat,
          onClick: () => toggleCategory(cat),
          style: {
            border: "none",
            borderRadius: 999,
            padding: "8px 13px",
            fontSize: 13,
            fontFamily: FONT,
            fontWeight: on ? 600 : 400,
            cursor: "pointer",
            background: on ? tint(T.gold, 0.16) : T.raised,
            color: on ? T.gold : T.faint
          }
        },
        cat
      );
    })))), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, onClick: onClose }, "Sulge"));
  }
  function diffCollection(ref, prevArr, nextArr) {
    const prevById = new Map((prevArr || []).map((x) => [x.id, x]));
    const nextIds = /* @__PURE__ */ new Set();
    const ops = [];
    (nextArr || []).forEach((item) => {
      if (!item || !item.id) return;
      nextIds.add(item.id);
      const prevItem = prevById.get(item.id);
      if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
        ops.push(ref.doc(item.id).set(item));
      }
    });
    prevById.forEach((_, id) => {
      if (!nextIds.has(id)) ops.push(ref.doc(id).delete());
    });
    return ops;
  }
  const HH_KEY = "fridgewise:household";
  const loadHousehold = () => {
    try {
      return localStorage.getItem(HH_KEY) || "";
    } catch (e) {
      return "";
    }
  };
  const storeHousehold = (code) => {
    try {
      if (code) localStorage.setItem(HH_KEY, code);
      else localStorage.removeItem(HH_KEY);
    } catch (e) {
    }
  };
  const normCode = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9äöüõ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const FIREBASE_CONFIG = typeof window !== "undefined" && window.__FIREBASE_CONFIG__ || null;
  function makeDb(code) {
    const base = window.firebase.firestore();
    const root2 = "households/" + code;
    return {
      doc: (p) => base.doc(root2 + "/" + p),
      collection: (p) => base.collection(root2 + "/" + p)
    };
  }
  const LOCAL_KEY = "fridgewise:localdb";
  const localState = { map: null, listeners: [] };
  function localLoad() {
    if (localState.map) return localState.map;
    let obj = {};
    try {
      obj = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") || {};
    } catch (e) {
      obj = {};
    }
    localState.map = obj;
    return obj;
  }
  function localPersist() {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(localState.map || {}));
    } catch (e) {
    }
  }
  function localNotify() {
    localState.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
      }
    });
  }
  function localSnap(path) {
    const m = localLoad();
    const data = m[path];
    return {
      id: path.split("/").pop(),
      exists: data !== void 0,
      data: () => data === void 0 ? void 0 : JSON.parse(JSON.stringify(data)),
      metadata: { fromCache: true, hasPendingWrites: false }
    };
  }
  function localColSnap(colPath, of, od, lim) {
    const m = localLoad();
    let docs = Object.keys(m).filter((p) => p.split("/").slice(0, -1).join("/") === colPath).map((p) => localSnap(p));
    if (of)
      docs.sort((a, b) => {
        const av = a.data()?.[of], bv = b.data()?.[of];
        if (av === bv) return 0;
        const r = av < bv ? -1 : 1;
        return od === "desc" ? -r : r;
      });
    else docs.sort((a, b) => a.id < b.id ? -1 : 1);
    if (lim) docs = docs.slice(0, lim);
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      docChanges: () => docs.map((d, i) => ({ type: "added", doc: d, oldIndex: -1, newIndex: i })),
      metadata: { fromCache: true, hasPendingWrites: false }
    };
  }
  function localDocRef(path) {
    return {
      id: path.split("/").pop(),
      path,
      get: async () => localSnap(path),
      set: async (d) => {
        localLoad()[path] = JSON.parse(JSON.stringify(d));
        localPersist();
        setTimeout(localNotify, 0);
      },
      update: async (d) => {
        const m = localLoad();
        m[path] = { ...m[path] || {}, ...JSON.parse(JSON.stringify(d)) };
        localPersist();
        setTimeout(localNotify, 0);
      },
      delete: async () => {
        delete localLoad()[path];
        localPersist();
        setTimeout(localNotify, 0);
      },
      onSnapshot(cb) {
        const fn = () => cb(localSnap(path));
        localState.listeners.push(fn);
        setTimeout(fn, 0);
        return () => {
          const i = localState.listeners.indexOf(fn);
          if (i >= 0) localState.listeners.splice(i, 1);
        };
      },
      collection: (sub) => localColRef(path + "/" + sub)
    };
  }
  function localColRef(path, of, od, lim) {
    return {
      path,
      doc: (id) => localDocRef(path + "/" + (id || "auto" + Math.random().toString(36).slice(2))),
      orderBy: (f, dir) => localColRef(path, f, dir || "asc", lim),
      limit: (n) => localColRef(path, of, od, n),
      where: () => localColRef(path, of, od, lim),
      get: async () => localColSnap(path, of, od, lim),
      onSnapshot(cb) {
        const fn = () => cb(localColSnap(path, of, od, lim));
        localState.listeners.push(fn);
        setTimeout(fn, 0);
        return () => {
          const i = localState.listeners.indexOf(fn);
          if (i >= 0) localState.listeners.splice(i, 1);
        };
      }
    };
  }
  function makeLocalDb(code) {
    const root2 = "households/" + code;
    return {
      doc: (p) => localDocRef(root2 + "/" + p),
      collection: (p) => localColRef(root2 + "/" + p)
    };
  }
  const HAS_FIREBASE = !!(FIREBASE_CONFIG && typeof window !== "undefined" && window.firebase);
  let FIREBASE_INIT_ERROR = "";
  if (HAS_FIREBASE) {
    try {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(FIREBASE_CONFIG);
      }
    } catch (e) {
      FIREBASE_INIT_ERROR = String(e && e.message || e);
    }
  }
  const HAS_AUTH = !!(HAS_FIREBASE && !FIREBASE_INIT_ERROR && window.firebase.auth);
  const authApi = HAS_AUTH ? window.firebase.auth() : null;
  function friendlyAuthError(e) {
    const code = e && e.code;
    if (code === "auth/email-already-in-use")
      return "See e-post on juba kasutusel \u2014 proovi hoopis sisse logida.";
    if (code === "auth/invalid-email") return "E-posti aadress ei tundu \xF5ige.";
    if (code === "auth/weak-password") return "Parool peab olema v\xE4hemalt 6 t\xE4hem\xE4rki.";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential")
      return "Vale e-post v\xF5i parool.";
    if (code === "auth/user-not-found") return "Sellise e-postiga kontot ei leitud.";
    if (code === "auth/too-many-requests") return "Liiga palju katseid \u2014 proovi hetke p\xE4rast uuesti.";
    if (code === "auth/network-request-failed") return "Interneti\xFChendus katkes.";
    if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found")
      return `Konto loomine pole veel Firebase's sisse l\xFClitatud. Ava Firebase konsool \u2192 Authentication \u2192 Sign-in method \u2192 luba "Email/Password" \u2192 Save (vt README.txt).`;
    const detail = code || e && e.message || "";
    return "Midagi l\xE4ks valesti. Proovi uuesti." + (detail ? ` (${detail})` : "");
  }
  const emptyProfile = () => ({
    notifications: { enabled: false, categories: {} }
  });
  function useAccount() {
    const [authUser, setAuthUser] = useState(null);
    const [authReady, setAuthReady] = useState(!HAS_AUTH);
    const [profile, setProfile] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState(!HAS_AUTH);
    const [authError, setAuthError] = useState("");
    const [authBusy, setAuthBusy] = useState(false);
    useEffect(() => {
      if (!HAS_AUTH) return;
      return authApi.onAuthStateChanged((u) => {
        setAuthUser(u);
        setAuthReady(true);
      });
    }, []);
    useEffect(() => {
      if (!HAS_AUTH || !authUser) {
        setProfile(null);
        setProfileLoaded(true);
        return;
      }
      setProfileLoaded(false);
      const ref = window.firebase.firestore().doc("users/" + authUser.uid);
      return ref.onSnapshot(
        (snap) => {
          if (snap.exists) setProfile({ ...emptyProfile(), ...snap.data() });
          else {
            const fresh = {
              ...emptyProfile(),
              email: authUser.email,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            ref.set(fresh).catch(() => {
            });
            setProfile(fresh);
          }
          setProfileLoaded(true);
        },
        () => setProfileLoaded(true)
      );
    }, [authUser]);
    const saveProfile = async (patch) => {
      if (!HAS_AUTH || !authUser) return;
      const next = { ...emptyProfile(), ...profile || {}, ...patch };
      setProfile(next);
      try {
        await window.firebase.firestore().doc("users/" + authUser.uid).set(next, { merge: true });
      } catch (e) {
      }
    };
    const signUp = async (email, password) => {
      setAuthError("");
      setAuthBusy(true);
      try {
        const cred = await authApi.createUserWithEmailAndPassword(email, password);
        try {
          await cred.user.sendEmailVerification();
        } catch (e) {
          console.error("NeedMore sendEmailVerification error:", e);
        }
      } catch (e) {
        console.error("NeedMore signUp error:", e);
        setAuthError(friendlyAuthError(e));
      }
      setAuthBusy(false);
    };
    const signIn = async (email, password) => {
      setAuthError("");
      setAuthBusy(true);
      try {
        await authApi.signInWithEmailAndPassword(email, password);
      } catch (e) {
        console.error("NeedMore signIn error:", e);
        setAuthError(friendlyAuthError(e));
      }
      setAuthBusy(false);
    };
    const signOutUser = async () => {
      try {
        await authApi.signOut();
      } catch (e) {
      }
    };
    return {
      hasAuth: HAS_AUTH,
      authUser,
      authReady,
      profile,
      profileLoaded,
      authError,
      authBusy,
      saveProfile,
      signUp,
      signIn,
      signOutUser
    };
  }
  function HouseholdGate({ onJoin }) {
    const [code, setCode] = useState("");
    const [checking, setChecking] = useState(false);
    const [existing, setExisting] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const ok = normCode(code).length >= 3;
    const checkAndJoin = async (c) => {
      if (!HAS_FIREBASE) {
        onJoin(c);
        return;
      }
      setChecking(true);
      try {
        const db = makeDb(c);
        const [stateSnap, receiptsSnap] = await Promise.all([
          db.doc("meta/state").get(),
          db.collection("receipts").limit(1).get()
        ]);
        const hasState = stateSnap.exists && Object.keys(stateSnap.data() || {}).length > 0;
        if (hasState || !receiptsSnap.empty) setExisting(c);
        else onJoin(c);
      } catch (e) {
        onJoin(c);
      }
      setChecking(false);
    };
    if (existing) {
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            fontFamily: FONT,
            color: T.ink,
            background: T.bg,
            minHeight: "100vh",
            maxWidth: 480,
            margin: "0 auto",
            padding: "0 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }
        },
        /* @__PURE__ */ React.createElement(Panel, { style: { padding: "22px 20px" } }, /* @__PURE__ */ React.createElement(Label, null, "See kood on juba kasutusel"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, color: T.soft, lineHeight: 1.6, marginBottom: 18 } }, "Koodi ", /* @__PURE__ */ React.createElement("b", { style: { color: T.ink } }, existing), " all on juba andmeid. Kui teine pereliige on selle koodiga juba nimekirja loonud, j\xE4tka \u2014 n\xE4ete sama nimekirja. Kui valisite kogemata sama koodi mis m\xF5ni teine pere, vali parem uus, ainulaadsem kood."), /* @__PURE__ */ React.createElement(Btn, { kind: "solid", full: true, style: { marginBottom: 8 }, onClick: () => onJoin(existing) }, "Jah, see on minu pere \u2014 j\xE4tka"), /* @__PURE__ */ React.createElement(Btn, { full: true, onClick: () => setExisting(null) }, "Vali teine kood"))
      );
    }
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT,
          color: T.ink,
          background: T.bg,
          minHeight: "100vh",
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitFontSmoothing: "antialiased"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 26 } }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: LOGO_FULL,
          alt: "NeedMore \u2014 See what's left. Know what's next.",
          style: { width: "100%", maxWidth: 300, height: "auto", display: "block", margin: "0 auto" }
        }
      )),
      /* @__PURE__ */ React.createElement(Panel, { style: { padding: "22px 20px" } }, /* @__PURE__ */ React.createElement(Label, null, "Pere-kood"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: T.soft, lineHeight: 1.55, marginBottom: 16 } }, "M\xF5elge v\xE4lja \xFCks \xFChine kood (nt teie perenimi) ja sisestage see m\xF5lemas telefonis. K\xF5ik, kes sama koodi teavad, n\xE4evad sama nimekirja."), /* @__PURE__ */ React.createElement(
        "input",
        {
          value: code,
          onChange: (e) => setCode(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && ok && !checking && checkAndJoin(normCode(code)),
          placeholder: "nt roustiku-pere",
          autoCapitalize: "none",
          autoCorrect: "off",
          style: field({ width: "100%", background: "#EEF2F7", marginBottom: 6, boxSizing: "border-box" })
        }
      ), code && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginBottom: 12 } }, "Kood: ", /* @__PURE__ */ React.createElement("b", { style: { color: T.ink } }, normCode(code) || "\u2014")), /* @__PURE__ */ React.createElement(
        Btn,
        {
          kind: "solid",
          full: true,
          style: { marginTop: 8, opacity: ok && !checking ? 1 : 0.5 },
          onClick: () => ok && !checking && checkAndJoin(normCode(code))
        },
        checking ? "Kontrollin\u2026" : "Ava nimekiri"
      )),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, textAlign: "center", marginTop: 18, lineHeight: 1.5 } }, "Koodi saab hiljem seadetes vahetada."),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowGuide(true),
          style: {
            border: "none",
            background: "transparent",
            color: T.gold,
            fontFamily: FONT,
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
            marginTop: 14,
            textAlign: "center"
          }
        },
        "Loe enne alustamist kasutusjuhendit \u2192"
      ),
      showGuide && /* @__PURE__ */ React.createElement(GuideSheet, { onClose: () => setShowGuide(false) })
    );
  }
  function CenteredNote({ title, children }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT,
          color: T.ink,
          background: T.bg,
          minHeight: "100vh",
          maxWidth: 480,
          margin: "0 auto",
          padding: "44px 26px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, marginBottom: 10 } }, title),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, color: T.faint, lineHeight: 1.55 } }, children)
    );
  }
  function App() {
    const [household, setHousehold] = useState(loadHousehold);
    const [fbReady, setFbReady] = useState(false);
    const [fbError, setFbError] = useState("");
    const [stateDoc, setStateDoc] = useState(null);
    const [receiptsList, setReceiptsList] = useState([]);
    const [purchasesList, setPurchasesList] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [dbFailed, setDbFailed] = useState(false);
    const [tab, setTab] = useState("list");
    const [sheet, setSheet] = useState(null);
    const [settings, setSettings] = useState(false);
    const [guide, setGuide] = useState(false);
    const [account, setAccount] = useState(false);
    const acc = useAccount();
    const notifiedRef = useRef(/* @__PURE__ */ new Set());
    const localMode = !HAS_FIREBASE;
    useEffect(() => {
      if (localMode) {
        setFbReady(true);
        return;
      }
      if (FIREBASE_INIT_ERROR) {
        setFbError(FIREBASE_INIT_ERROR);
        return;
      }
      setFbReady(true);
    }, []);
    const dbApi = useMemo(
      () => fbReady && household ? localMode ? makeLocalDb(household) : makeDb(household) : null,
      [fbReady, household, localMode]
    );
    useEffect(() => {
      if (!dbApi) return;
      setLoaded(false);
      setStateDoc(null);
      setReceiptsList([]);
      setPurchasesList([]);
      const unsubState = dbApi.doc("meta/state").onSnapshot(
        (snap) => {
          setStateDoc(snap.exists ? snap.data() : {});
          setLoaded(true);
        },
        () => {
          setDbFailed(true);
          setLoaded(true);
        }
      );
      const unsubReceipts = dbApi.collection("receipts").orderBy("date", "desc").limit(500).onSnapshot(
        (snap) => setReceiptsList(snap.docs.map((d) => d.data())),
        () => setDbFailed(true)
      );
      const unsubPurchases = dbApi.collection("purchases").orderBy("date", "desc").limit(1e3).onSnapshot(
        (snap) => setPurchasesList(snap.docs.map((d) => d.data())),
        () => setDbFailed(true)
      );
      return () => {
        unsubState();
        unsubReceipts();
        unsubPurchases();
      };
    }, [dbApi]);
    const data = useMemo(
      () => ({
        ...emptyData,
        ...stateDoc || {},
        receipts: receiptsList,
        manualPurchases: purchasesList
      }),
      [stateDoc, receiptsList, purchasesList]
    );
    const save = async (next) => {
      if (!dbApi) return;
      const { receipts: nextReceipts, manualPurchases: nextPurchases, ...rest } = next;
      const ops = [
        dbApi.doc("meta/state").set(rest),
        ...diffCollection(dbApi.collection("receipts"), data.receipts, nextReceipts),
        ...diffCollection(dbApi.collection("purchases"), data.manualPurchases, nextPurchases)
      ];
      try {
        await Promise.all(ops);
      } catch (e) {
        console.error("Salvestamine eba\xF5nnestus", e);
        setDbFailed(true);
      }
    };
    const leaveHousehold = () => {
      storeHousehold("");
      setHousehold("");
      setSettings(false);
      setStateDoc(null);
      setReceiptsList([]);
      setPurchasesList([]);
      setLoaded(false);
    };
    const products = useMemo(() => buildProducts(data), [data]);
    const needCount = products.filter((p) => !p.hidden && p.progress >= 0.7).length;
    const sheetProduct = sheet ? products.find((x) => x.k === sheet.k) : null;
    useEffect(() => {
      const prefs = acc.profile?.notifications;
      if (!prefs?.enabled) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      products.filter((p) => !p.hidden && p.progress >= 1).forEach((p) => {
        const catOn = prefs.categories?.[p.category] !== false;
        if (!catOn) return;
        if (notifiedRef.current.has(p.k)) return;
        notifiedRef.current.add(p.k);
        try {
          new Notification("NeedMore", { body: `${p.name} on otsas`, tag: "needmore-" + p.k });
        } catch (e) {
        }
      });
      const stillOut = new Set(products.filter((p) => p.progress >= 1).map((p) => p.k));
      notifiedRef.current.forEach((k) => {
        if (!stillOut.has(k)) notifiedRef.current.delete(k);
      });
    }, [products, acc.profile]);
    const tabs = [
      { id: "list", label: "Nimekiri" },
      { id: "add", label: "T\u0161ekk" },
      { id: "recipes", label: "Retseptid" },
      { id: "stats", label: "Kulud" }
    ];
    const titles = {
      list: "Mis on otsas",
      add: "Lisa ost",
      recipes: "Mida s\xFC\xFCa",
      stats: "Raha ja tooted"
    };
    if (fbError)
      return /* @__PURE__ */ React.createElement(CenteredNote, { title: "\xDChendust ei \xF5nnestunud luua" }, "Kontrolli interneti\xFChendust ja proovi leht uuesti laadida.");
    if (!household) return /* @__PURE__ */ React.createElement(HouseholdGate, { onJoin: (c) => {
      storeHousehold(c);
      setHousehold(c);
    } });
    if (!loaded)
      return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT, background: T.bg, minHeight: "100vh", padding: 44, textAlign: "center", color: T.faint } }, "Avan\u2026");
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT,
          color: T.ink,
          background: T.bg,
          minHeight: "100vh",
          maxWidth: 480,
          margin: "0 auto",
          paddingBottom: 82,
          WebkitFontSmoothing: "antialiased"
        }
      },
      /* @__PURE__ */ React.createElement("style", null, `
        @keyframes slideup { from { transform: translateY(22px); } to { transform: none; } }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes nm-pat {
          0%, 100% { transform: none; }
          14% { transform: translateY(2px) scale(1.03, .97); }
          28% { transform: none; }
          42% { transform: translateY(2px) scale(1.03, .97) rotate(-2deg); }
          58% { transform: rotate(1.5deg); }
          74% { transform: none; }
        }
        @keyframes nm-hop {
          0%, 100% { transform: none; }
          25% { transform: translateY(-7px); }
          45% { transform: scale(1.04, .96); }
          62% { transform: translateY(-3px); }
          80% { transform: none; }
        }
        .nm-pat { animation: nm-pat 1.4s ease-in-out .25s 1 both; transform-origin: 50% 92%; }
        .nm-hop { animation: nm-hop 1.2s ease-out .25s 1 both; transform-origin: 50% 100%; }
        button { transition: transform .18s ease, opacity .18s ease; }
        button:hover { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        input::placeholder { color: ${T.faint}; }
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid ${T.ink}; outline-offset: 3px;
        }
      `),
      dbFailed && /* @__PURE__ */ React.createElement("div", { style: { background: tint(T.soon, 0.14), color: T.soon, fontSize: 12.5, textAlign: "center", padding: "8px 14px" } }, "\xDChendus andmebaasiga logises \u2014 kontrolli internetti."),
      localMode && /* @__PURE__ */ React.createElement("div", { style: { background: tint(T.gold, 0.1), color: T.gold, fontSize: 12.5, textAlign: "center", padding: "8px 14px", lineHeight: 1.4 } }, "Prooviversioon \u2014 andmed ainult selles seadmes. Kahe telefoni jagamiseks tuleb \xE4pp veebi \xFCles seada."),
      /* @__PURE__ */ React.createElement("div", { style: { padding: "18px 18px 4px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1, paddingRight: 10 } }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: LOGO_FULL,
          alt: "NeedMore \u2014 See what's left. Know what's next.",
          style: { height: 46, width: "auto", maxWidth: "100%", display: "block" }
        }
      ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: T.faint, marginTop: 8, letterSpacing: ".01em" } }, "Pere-kood: ", household)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 3 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setGuide(true),
          style: { border: "none", borderRadius: 999, background: T.raised, color: T.gold, fontSize: 13.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", padding: "8px 14px" }
        },
        "Juhend"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setAccount(true),
          "aria-label": "Minu konto",
          style: { border: "none", borderRadius: 999, background: T.raised, color: T.gold, cursor: "pointer", padding: "9px 13px", display: "flex", alignItems: "center", position: "relative" }
        },
        /* @__PURE__ */ React.createElement("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" }))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setSettings(true),
          "aria-label": "Ava seaded",
          style: { border: "none", borderRadius: 999, background: T.raised, color: T.gold, cursor: "pointer", padding: "9px 13px", display: "flex", alignItems: "center" }
        },
        /* @__PURE__ */ React.createElement("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))
      ))), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 27, fontWeight: 600, margin: "0 0 14px", letterSpacing: "-0.03em" } }, titles[tab], tab === "list" && needCount > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: T.faint, fontWeight: 400, fontSize: 15 } }, "  ", needCount, " toodet"))),
      tab === "list" && /* @__PURE__ */ React.createElement(ListView, { products, data, save, onOpen: setSheet }),
      tab === "add" && /* @__PURE__ */ React.createElement(AddView, { data, save, products, goList: () => setTab("list"), imagesOk: HAS_FIREBASE }),
      tab === "recipes" && /* @__PURE__ */ React.createElement(
        RecipesView,
        {
          data,
          save,
          products
        }
      ),
      tab === "stats" && /* @__PURE__ */ React.createElement(MoneyTab, { data, products, onOpen: setSheet }),
      sheetProduct && /* @__PURE__ */ React.createElement(ProductSheet, { p: sheetProduct, data, save, onClose: () => setSheet(null), onKeyChange: (k) => setSheet({ k }) }),
      guide && /* @__PURE__ */ React.createElement(GuideSheet, { onClose: () => setGuide(false) }),
      settings && /* @__PURE__ */ React.createElement(SettingsSheet, { data, save, onClose: () => setSettings(false), household, onLeaveHousehold: leaveHousehold }),
      account && /* @__PURE__ */ React.createElement(AccountSheet, { acc, onClose: () => setAccount(false) }),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: "0 auto",
            background: "rgba(244,246,249,.9)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            padding: "10px 8px 16px"
          }
        },
        tabs.map((t) => {
          const on = tab === t.id;
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: t.id,
              onClick: () => setTab(t.id),
              style: {
                flex: 1,
                position: "relative",
                border: "none",
                background: on ? "#E9F0F7" : "transparent",
                borderRadius: 22,
                padding: "9px 0 8px",
                fontSize: 10.5,
                fontFamily: FONT,
                cursor: "pointer",
                color: on ? T.gold : T.faint,
                fontWeight: on ? 700 : 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }
            },
            /* @__PURE__ */ React.createElement(Icon, { name: t.id, size: 19 }),
            t.label,
            t.id === "list" && needCount > 0 && !on && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: 7, right: "24%", width: 5, height: 5, borderRadius: 3, background: T.out } })
          );
        })
      )
    );
  }
  const rootEl = document.getElementById("root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
