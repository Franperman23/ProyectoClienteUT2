const fechaLimite = new Date ("2025-12-26T18:00:00Z");
//const fechaLimite = new Date(Date.now() - 1000); Para forzar la resolucion del sorteo. En el .env cambiar: Fecha_Sorteo: 2000-01-01T00:00:00Z

function revisar() {
  const now = new Date();
  if (now >= fechaLimite) {
    document.getElementById("resolver").style.display = "block";
    document.getElementById("form").style.display = "none";
  }
}

revisar();
setInterval(revisar, 10000);

document.getElementById("btnResolver").addEventListener("click", async () => {
  const num = document.getElementById("numGanadores").value;

  const res = await fetch("/api/resolver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ num })
  });

  const data = await res.json();
  document.getElementById("resultado").innerText =
    JSON.stringify(data, null, 2);
});
