const fechaSorteo = new Date ("2025-11-26T18:00:00Z");
//const fechaSorteo = new Date(Date.now() - 1000);
document.getElementById("infoSorteo").innerText =
  "El sorteo se resolverá el: " + fechaSorteo.toLocaleString();

document.getElementById("form").addEventListener("submit", async e => {
  e.preventDefault();

  if (!acepto.checked) {
    mensaje.innerText = "Debes aceptar la política de protección de datos.";
    return;
  }

  const data = {
    nombre: nombre.value,
    apellidos: apellidos.value,
    email: email.value,
    telefono: telefono.value,
    nacimiento: nacimiento.value
  };

  // Cookie de usuario
  document.cookie =
    `usuario=${encodeURIComponent(JSON.stringify({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono
    }))}; max-age=${60 * 60 * 24 * 30}; path=/`;

  // Enviar datos al servidor
  const res = await fetch("/api/participantes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const respuesta = await res.json();

  if (!res.ok) {
    mensaje.innerText = respuesta.error || "Error al enviar datos.";
    return;
  }

  // Si todo va bien
  mensaje.innerText = "¡Inscripción correcta!";
});
