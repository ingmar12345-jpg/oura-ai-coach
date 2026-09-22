// NeedMore — AI-proxy Netlify serverless funktsioon.
//
// Miks see on vajalik: Claude API võti EI TOHI olla nähtav telefoni brauseris
// (kõik äpi kood on seal näha). Seega jookseb see väike funktsioon Netlify
// serveris, hoiab võtit turvaliselt keskkonnamuutujana ja edastab päringu
// Claude API-le. Äpp ise räägib ainult selle funktsiooniga.
//
// Seadistus (tee üks kord Netlify konsoolis):
//   Site configuration -> Environment variables -> Add a variable
//   Key:   ANTHROPIC_API_KEY
//   Value: <sinu Anthropic API võti console.anthropic.com'ist>
// Pärast lisamist tee saidile uus "Deploy" (nt "Trigger deploy" nupp,
// või lohista fail uuesti Deploys vahekaardile), et muutus jõustuks.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code: "bad_request", message: "Ainult POST on lubatud" }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: false,
        code: "not_configured",
        message: "ANTHROPIC_API_KEY puudub Netlify keskkonnamuutujate seast.",
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code: "bad_request", message: "Vigane päring" }),
    };
  }

  const prompt = payload && payload.prompt;
  const image = payload && payload.image;
  if (!prompt || typeof prompt !== "string") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code: "bad_request", message: "prompt puudub" }),
    };
  }

  const content = [];
  if (image && typeof image === "string") {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image);
    if (m) {
      content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
    }
  }
  content.push({ type: "text", text: prompt });

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        messages: [{ role: "user", content }],
      }),
    });
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code: "network_error", message: String((e && e.message) || e) }),
    };
  }

  const raw = await resp.text();

  if (!resp.ok) {
    let code = "refused";
    if (resp.status === 429) code = "rate_limited";
    if (resp.status === 401 || resp.status === 403) code = "not_configured";
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code, message: raw.slice(0, 500) }),
    };
  }

  let apiJson;
  try {
    apiJson = JSON.parse(raw);
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, code: "invalid_json", message: "Vastust ei õnnestunud lugeda" }),
    };
  }

  const text = (apiJson.content || [])
    .map((c) => c.text || "")
    .join("")
    .trim();
  const cleaned = text
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: false,
        code: "invalid_json",
        message: "Vastus tuli ootamatus vormingus",
      }),
    };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, data }) };
};
