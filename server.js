const express = require("express");
const bodyParser = require("body-parser");
const { create } = require("xmlbuilder2");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const FILE = path.join(__dirname, "persone.xml");

app.get("/", (req, res) => {
  res.send(`
    <form method="POST" action="/salva">
      <label>Nome: <input type="text" name="nome" required></label><br>
      <label>Cognome: <input type="text" name="cognome" required></label><br>
      <label>Data di nascita: <input type="date" name="data_nascita" required></label><br>
      <label>Telefono: <input type="text" name="telefono" required></label><br>
      <button type="submit">Salva</button>
    </form>
  `);
});

app.post("/salva", (req, res) => {
  try {
    const { nome, cognome, data_nascita, telefono } = req.body;

    // Nuovo oggetto persona
    const personaObj = {
      nome,
      cognome,
      data_nascita,
      telefono
    };

    let xmlObj;

    if (fs.existsSync(FILE)) {
      const xmlText = fs.readFileSync(FILE, "utf-8");

      // Se il file è vuoto -> lo trattiamo come non esistente
      if (!xmlText.trim()) {
        xmlObj = { persone: { persona: [personaObj] } };
      } else {
        // Parse dell'XML in oggetto JS
        // create(xmlString) restituisce un documento; toObject() converte in JS object
        const xmlDoc = create(xmlText);
        xmlObj = xmlDoc.toObject();

        // Garantiamo che esista la radice 'persone'
        if (!xmlObj.persone) {
          xmlObj.persone = {};
        }

        // Caso: non esiste ancora 'persona' -> crealo come array con il nuovo oggetto
        if (xmlObj.persone.persona === undefined) {
          xmlObj.persone.persona = [personaObj];

        } else {
          // Se esiste ma NON è array -> trasformalo in array mantenendo il valore esistente
          const current = xmlObj.persone.persona;

          if (Array.isArray(current)) {
            // tutto ok, è già array
            current.push(personaObj);
          } else {
            // può essere stringa o oggetto singolo — lo convertiamo in array
            xmlObj.persone.persona = [current, personaObj];
          }
        }
      }
    } else {
      // Primo inserimento: creiamo la struttura corretta
      xmlObj = { persone: { persona: [personaObj] } };
    }

    // Genera XML bello formattato e scrive il file (SOVRASCRIVE)
    const newXml = create(xmlObj).end({ prettyPrint: true });
    fs.writeFileSync(FILE, newXml, "utf-8");

    res.send("Dati salvati correttamente in persone.xml");

  } catch (err) {
    console.error("Errore salvataggio XML:", err);
    res.status(500).send("Errore interno: " + err.message);
  }
});

app.listen(3000, () => console.log("Server avviato su http://localhost:3000"));
