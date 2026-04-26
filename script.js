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

function leerHistorial() {
  try {
    return JSON.parse(localStorage.getItem("historialExplicaciones") || "[]");
  } catch (error) {
    return [];
  }
}

function guardarEnHistorial(texto, resultado) {
  const historialActual = leerHistorial();
  const nuevoItem = {
    texto: texto.slice(0, 160),
    resultado: resultado.slice(0, 500),
    fecha: new Date().toLocaleString("es-ES")
  };

  const siguienteHistorial = [nuevoItem, ...historialActual].slice(0, 5);
  localStorage.setItem("historialExplicaciones", JSON.stringify(siguienteHistorial));
  renderizarHistorial();
}

function renderizarHistorial() {
  const historial = leerHistorial();
  const contenedor = document.getElementById("historial");
  if (!contenedor) return;

  if (historial.length === 0) {
    contenedor.className = "historial-vacio";
    contenedor.innerText = "Aun no hay explicaciones guardadas.";
    return;
  }

  contenedor.className = "";
  contenedor.innerHTML = historial
    .map(
      (item) =>
        '<article class="history-item">' +
        "<p>" + item.fecha + "</p>" +
        "<pre>" + item.resultado + "</pre>" +
        "</article>"
    )
    .join("");
}

function limpiarHistorial() {
  localStorage.removeItem("historialExplicaciones");
  renderizarHistorial();
}

async function copiarResultado() {
  const textoResultado = document.getElementById("resultado").innerText;
  if (!textoResultado || textoResultado === "Tu explicación aparecerá aquí.") {
    return;
  }

  try {
    await navigator.clipboard.writeText(textoResultado);
    const boton = document.getElementById("copiarBtn");
    const textoOriginal = boton.innerText;
    boton.innerText = "Copiado";
    setTimeout(() => {
      boton.innerText = textoOriginal;
    }, 1200);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarModoGuardado();
  renderizarHistorial();
});

async function explicar() {
  const texto = document.getElementById("inputText").value;
  const resultado = document.getElementById("resultado");
  const boton = document.getElementById("explicarBtn");

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
    const response = await fetch("/api/explicar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto })
    });
    const data = await response.json();

    if (!response.ok) {
      const apiError = data?.error || "Error desconocido del servidor.";
      resultado.classList.add("error");
      resultado.innerText = "Error (" + response.status + "): " + apiError;
      return;
    }

    resultado.classList.add("ok");
    const textoResultado = data.resultado || "No hubo respuesta del modelo.";
    resultado.innerText = textoResultado;
    guardarEnHistorial(texto, textoResultado);
  } catch (error) {
    resultado.classList.add("error");
    resultado.innerText =
      "Error de red. Verifica que el backend este desplegado y funcionando.";
    console.error(error);
  } finally {
    boton.disabled = false;
    boton.innerText = "Explicar con IA";
  }
}
