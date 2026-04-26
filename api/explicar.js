module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});
    const {
      texto,
      curso = "ESO",
      asignatura = "General",
      dificultad = "Intermedio",
      tipoSalida = "Paso a paso"
    } = body;
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: "Falta texto para explicar" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en el servidor" });
    }

    const modelosResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
    );
    const modelosData = await modelosResponse.json();

    if (!modelosResponse.ok) {
      return res.status(modelosResponse.status).json({
        error: modelosData?.error?.message || "No se pudieron listar modelos de Gemini"
      });
    }

    const modelosDisponibles = (modelosData.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => (m.name || "").replace("models/", ""));

    if (modelosDisponibles.length === 0) {
      return res.status(502).json({
        error: "Tu API key no tiene modelos compatibles con generateContent"
      });
    }

    let ultimoError = "No se pudo consultar Gemini";

    const prompt = [
      "Eres un profesor que explica de forma clara y didactica.",
      "Adapta la respuesta a este contexto:",
      "- Curso: " + curso,
      "- Asignatura: " + asignatura,
      "- Dificultad: " + dificultad,
      "- Formato: " + tipoSalida,
      "",
      "Reglas:",
      "1) Usa espanol claro y ordenado.",
      "2) Si el formato es paso a paso, numerar pasos.",
      "3) Si es mini test, incluye 3 preguntas con respuestas al final.",
      "4) Evita tecnicismos innecesarios para el nivel indicado.",
      "",
      "Texto del estudiante:",
      texto
    ].join("\n");

    for (const modelo of modelosDisponibles) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        ultimoError = data?.error?.message || "Error al consultar Gemini";
        continue;
      }

      const resultado =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No hubo respuesta del modelo.";

      return res.status(200).json({ resultado });
    }

    return res.status(502).json({ error: ultimoError });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
