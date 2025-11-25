require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const FECHA_SORTEO = new Date(process.env.SORTEO_FECHA);
const NUM_GANADORES = parseInt(process.env.NUM_GANADORES) || 3;

// Conexión MongoDB
const client = new MongoClient(MONGO_URI);

async function main() {
  try {
    await client.connect();
    console.log("MongoDB conectado correctamente");

    const db = client.db("sorteos");
    
    const Participantes = db.collection("participantes"); 
    const Ganadores = db.collection("ganadores");

    // Insertar participante
    app.post("/api/participantes", async (req, res) => {
      try {
        const participante = req.body;

        if (!participante.nombre || !participante.apellidos || !participante.email || !participante.telefono) {
          return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Comprobar duplicados
        const existente = await Participantes.findOne({
          $or: [
            { email: participante.email },
            { telefono: participante.telefono }
          ]
        });

        if (existente) {
          return res.status(409).json({ error: "Ya existe un participante con ese email o teléfono" });
        }

        participante.fechaRegistro = new Date();

        const resultado = await Participantes.insertOne(participante);

        return res.json({ ok: true, id: resultado.insertedId });

      } catch (err) {
        console.error("❌ Error al insertar participante:", err);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    });

    // Listar participantes
    app.get("/api/participantes", async (req, res) => {
      const datos = await Participantes.find().toArray();
      res.json(datos);
    });

    // Borrar participante por ID
    app.delete("/api/participantes/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await Participantes.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Participante no encontrado" });
        }

        res.json({ ok: true, mensaje: "Participante eliminado correctamente" });

      } catch (err) {
        console.error("Error al borrar participante:", err);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    });

    // Listar ganadores
    app.get("/api/ganadores", async (req, res) => {
      const datos = await Ganadores.find().toArray();
      res.json(datos);
    });

    // Exportar excel
    app.get("/api/export", async (req, res) => {
      try {
        const datos = await Participantes.find().toArray();
        const exportData = datos.map(({ _id, ...rest }) => ({
          id: _id.toString(),
          ...rest
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Participantes");

        const excelBuffer = XLSX.write(wb, {
          bookType: "xlsx",
          type: "buffer"
        });

        res.setHeader("Content-Disposition", "attachment; filename=participantes.xlsx");
        res.setHeader("Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(excelBuffer);

      } catch (err) {
        console.error("Error en GET /api/export:", err);
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    
    app.post("/api/resolver", async (req, res) => {
      try {
        const num = parseInt(req.body.num) || NUM_GANADORES;

        // Comprobar fecha del sorteo
        if (new Date() < FECHA_SORTEO) {
          return res.status(400).json({
            error: "Aún no se puede resolver el sorteo. No ha llegado la fecha."
          });
        }

        // Obtener participantes
        const participantes = await Participantes.find().toArray();

        if (participantes.length === 0) {
          return res.status(400).json({ error: "No hay participantes" });
        }

        // Elegir ganadores aleatorios
        const ganadores = [];
        const usados = new Set();

        while (ganadores.length < num && ganadores.length < participantes.length) {
          const index = Math.floor(Math.random() * participantes.length);
          if (!usados.has(index)) {
            usados.add(index);
            ganadores.push(participantes[index]);
          }
        }

        // Guardar ganadores en DB
        await Ganadores.deleteMany({});
        await Ganadores.insertMany(ganadores);

        res.json({
          ok: true,
          ganadores
        });

      } catch (err) {
        console.error("Error en /api/resolver:", err);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor funcionando en: http://localhost:${PORT}`);
      console.log(`Sorteo programado para: ${FECHA_SORTEO}`);
      console.log(`Número de ganadores: ${NUM_GANADORES}`);
    });

  } catch (err) {
    console.error("Error general:", err);
  }
}

main();
