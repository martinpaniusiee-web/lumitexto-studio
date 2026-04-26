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
    resultado.innerText = data.resultado || "No hubo respuesta del modelo.";
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
