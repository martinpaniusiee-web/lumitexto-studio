module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const { texto } = req.body || {};
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: "Falta texto para explicar" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en el servidor" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Explicame esto de forma sencilla como para un nino:\n\n" + texto
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Error al consultar Gemini"
      });
    }

    const resultado =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No hubo respuesta del modelo.";

    return res.status(200).json({ resultado });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
