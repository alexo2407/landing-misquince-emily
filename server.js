const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const TXT_FILE = path.join(ROOT, "invitados.txt");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

const TXT_HEADER = [
  "# ============================================================================",
  "# LISTA DE INVITADOS CONFIRMADOS — MIS XV AÑOS EMILY",
  "# Formato: FECHA_Y_HORA | NOMBRE_COMPLETO | ESTADO",
  "# ============================================================================",
  ""
].join("\n");

function ensureTxtFile() {
  if (!fs.existsSync(TXT_FILE)) {
    fs.writeFileSync(TXT_FILE, TXT_HEADER, "utf8");
  }
}

function parseGuestsFromTxt() {
  ensureTxtFile();
  const content = fs.readFileSync(TXT_FILE, "utf8");
  const lines = content.split(/\r?\n/);
  const guests = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("|").map((p) => p.trim());
    if (parts.length >= 2) {
      guests.push({
        id: guests.length + 1,
        fecha: parts[0] || "",
        nombre: parts[1] || "",
        estado: parts[2] || "Asistencia confirmada"
      });
    }
  });

  return { guests, raw: content };
}

function writeGuestsToTxt(guests) {
  const lines = guests.map(
    (g) => `${g.fecha || ""} | ${g.nombre || ""} | ${g.estado || "Asistencia confirmada"}`
  );
  const content = TXT_HEADER + (lines.length > 0 ? lines.join("\n") + "\n" : "");
  fs.writeFileSync(TXT_FILE, content, "utf8");
}

function buildCsvFromGuests(guests) {
  const escapeCsv = (val) => {
    const str = String(val == null ? "" : val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const header = ["No.", "Nombre del Invitado", "Estado de Asistencia", "Fecha y Hora"].join(",");
  const rows = guests.map((g, i) =>
    [i + 1, escapeCsv(g.nombre), escapeCsv(g.estado || "Asistencia confirmada"), escapeCsv(g.fecha)].join(",")
  );
  return "\uFEFF" + [header].concat(rows).join("\r\n") + "\r\n";
}

function formatDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ampm = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
}

function appendGuestToTxt(nombre, estado = "Asistencia confirmada") {
  ensureTxtFile();
  const cleanName = String(nombre || "")
    .replace(/[\r\n|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanName) {
    throw new Error("El nombre del invitado es obligatorio.");
  }

  const cleanStatus = String(estado || "Asistencia confirmada")
    .replace(/[\r\n|]+/g, " ")
    .trim();

  const fecha = formatDateTime(new Date());
  const line = `${fecha} | ${cleanName} | ${cleanStatus}\n`;
  fs.appendFileSync(TXT_FILE, line, "utf8");

  return { fecha, nombre: cleanName, estado: cleanStatus };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function redirectToHome(res) {
  res.writeHead(302, {
    Location: "/",
    "Cache-Control": "no-store"
  });
  res.end();
}

http
  .createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = decodeURIComponent(parsedUrl.pathname);

      // 1. Consultar lista de invitados
      if (pathname === "/api/invitados" && req.method === "GET") {
        const data = parseGuestsFromTxt();
        return sendJson(res, 200, { ok: true, guests: data.guests });
      }

      // 2. Descargar directamente en formato CSV compatible con Excel
      if (pathname === "/invitados.csv" && req.method === "GET") {
        const data = parseGuestsFromTxt();
        const csv = buildCsvFromGuests(data.guests);
        res.writeHead(200, {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="invitados-xv-emily.csv"',
          "Cache-Control": "no-store"
        });
        return res.end(csv);
      }

      // 3. Guardar nuevo invitado
      if (pathname === "/api/invitados" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 32 * 1024) {
            req.destroy();
          }
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            const entry = appendGuestToTxt(payload.nombre, payload.estado);
            const data = parseGuestsFromTxt();
            return sendJson(res, 201, {
              ok: true,
              entry,
              total: data.guests.length
            });
          } catch (err) {
            return sendJson(res, 400, {
              ok: false,
              error: err.message || "Error al guardar la confirmación."
            });
          }
        });
        return;
      }

      // 4. Eliminar un invitado específico o limpiar toda la lista
      if (pathname === "/api/invitados" && req.method === "DELETE") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 32 * 1024) {
            req.destroy();
          }
        });
        req.on("end", () => {
          try {
            const payload = body ? JSON.parse(body) : {};
            const idParam = parsedUrl.searchParams.get("id") || payload.id;

            if (payload.all === true || parsedUrl.searchParams.get("all") === "1") {
              writeGuestsToTxt([]);
              return sendJson(res, 200, { ok: true, guests: [] });
            }

            if (idParam != null) {
              const targetId = Number(idParam);
              const current = parseGuestsFromTxt().guests;
              const remaining = current
                .filter((g) => g.id !== targetId)
                .map((g, idx) => ({ ...g, id: idx + 1 }));
              writeGuestsToTxt(remaining);
              return sendJson(res, 200, { ok: true, guests: remaining });
            }

            return sendJson(res, 400, { ok: false, error: "Indica el registro a eliminar." });
          } catch (err) {
            return sendJson(res, 400, {
              ok: false,
              error: err.message || "Error al actualizar la lista."
            });
          }
        });
        return;
      }

      // 5. Permitir acceso únicamente al Home (/ o /index.html), a la ruta privada (/invitados o /invitados.html)
      //    y a recursos estáticos existentes. Cualquier otra ruta desconocida redirige al Home (/).
      let relPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      if (relPath === "invitados" || relPath === "invitados/") {
        relPath = "invitados.html";
      }

      const filePath = path.resolve(ROOT, relPath);
      if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) {
        return redirectToHome(res);
      }

      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          // Si la ruta o archivo no existe, redirigir siempre a la página principal de la invitación (/)
          return redirectToHome(res);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME[ext] || "application/octet-stream";
        const range = req.headers.range;

        const extraHeaders = {};
        if (relPath.toLowerCase() === "invitados.txt" && parsedUrl.searchParams.get("download") === "1") {
          extraHeaders["Content-Disposition"] = 'attachment; filename="invitados.txt"';
        }

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          if (start >= stat.size || end >= stat.size) {
            res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
            return res.end();
          }
          res.writeHead(206, {
            ...extraHeaders,
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
          });
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          res.writeHead(200, {
            ...extraHeaders,
            "Content-Type": contentType,
            "Content-Length": stat.size,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
          });
          fs.createReadStream(filePath).pipe(res);
        }
      });
    } catch (e) {
      return redirectToHome(res);
    }
  })
  .listen(PORT, "127.0.0.1", () => {
    ensureTxtFile();
    console.log(`Servidor de Mis XV Años activo en http://127.0.0.1:${PORT}`);
  });
