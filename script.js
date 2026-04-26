function toggleModo() {
  const body = document.body;
  const botonModo = document.getElementById("modoBtn");
  const darkActivo = body.classList.toggle("dark");
  botonModo.innerText = darkActivo ? "Modo claro" : "Modo oscuro";
  localStorage.setItem("modoTema", darkActivo ? "dark" : "light");
}

function cargarModoGuardado() {
  const modoGuardado = localStorage.getItem("modoTema");
  const botonModo = document.getElementById("modoBtn");

  if (modoGuardado === "dark") {
    document.body.classList.add("dark");
    botonModo.innerText = "Modo claro";
  } else {
    botonModo.innerText = "Modo oscuro";
  }
}

document.addEventListener("DOMContentLoaded", cargarModoGuardado);

async function explicar() {
  const texto = document.getElementById("inputText").value;
  const resultado = document.getElementById("resultado");
  const boton = document.getElementById("explicarBtn");
  const apiKey = "AIzaSyBrr-dAQf3rVQIhycEhaeAnh59KuwepXqI";

  resultado.classList.remove("ok", "error");

  if (!texto.trim()) {
    resultado.classList.add("error");
    resultado.innerText = "Escribe o pega un texto primero.";
    return;
  }

  boton.disabled = true;
  boton.innerText = "Explicando...";
  resultado.innerText = "Pensando...";

  try {
    const modelsRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
    );
    const modelsData = await modelsRes.json();

    if (!modelsRes.ok) {
      const modelsError = modelsData?.error?.message || "No se pudo listar modelos.";
      resultado.classList.add("error");
      resultado.innerText =
        "Error de autenticacion/API key (" + modelsRes.status + "): " + modelsError;
      return;
    }

    const modelosDisponibles = (modelsData.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => (m.name || "").replace("models/", ""));

    if (modelosDisponibles.length === 0) {
      resultado.classList.add("error");
      resultado.innerText = "Tu API key no tiene modelos compatibles con generateContent.";
      return;
    }

    const modelo = modelosDisponibles[0];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        modelo +
        ":generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Explícame esto de forma sencilla como para un niño:\n\n" + texto
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const apiError = data?.error?.message || "Error desconocido de la API.";
      resultado.classList.add("error");
      resultado.innerText =
        "Error al generar (" + response.status + ") con " + modelo + ": " + apiError;
      return;
    }

    resultado.classList.add("ok");
    resultado.innerText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No hubo respuesta del modelo.";
  } catch (error) {
    resultado.classList.add("error");
    resultado.innerText =
      "Error de red/CORS. Abre con Live Server y revisa consola (F12).";
    console.error(error);
  } finally {
    boton.disabled = false;
    boton.innerText = "Explicar con IA";
  }
}
