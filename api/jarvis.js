export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY non configurata"
    });
  }

  const { message, history = [] } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Messaggio mancante" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions:
          "Sei JARVIS, assistente personale di Dave. Rispondi in italiano in modo brillante, pratico, sintetico e affidabile.",
        input: [
          ...history.slice(-10),
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Errore OpenAI API"
      });
    }

    let answer = "";

    for (const item of data.output || []) {
      for (const part of item.content || []) {
        if (part.type === "output_text" && part.text) {
          answer += part.text;
        }
      }
    }

    return res.status(200).json({
      answer: answer || "Nessuna risposta ricevuta."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
