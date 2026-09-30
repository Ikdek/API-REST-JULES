const express = require("express");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

function findProduct(id) {
  const query = db.prepare("SELECT * FROM products WHERE id = ?");
  return query.get(id);
}

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

/*
 ██████╗ ███████╗████████╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗███████╗
██╔════╝ ██╔════╝╚══██╔══╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝
██║  ███╗█████╗     ██║       ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ███████╗
██║   ██║██╔══╝     ██║       ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ╚════██║
╚██████╔╝███████╗   ██║       ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ███████║
 ╚═════╝ ╚══════╝   ╚═╝       ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚══════╝                                                                                           
 */                                                          

app.get("/products", (req, res) => {
  if (req.query.id === undefined) {
    const products = db.prepare("SELECT * FROM products").all();
    return res.json(products);
  }

  const id = Number(req.query.id);
  if (!isValidId(id)) {
    return res.status(400).json({ error: "Veuillez rentrer un ID de produit valide !" });
  }

  const product = findProduct(id);
  if (!product) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  res.json(product);
});

/*
██████╗  ██████╗ ███████╗████████╗     █████╗ ██████╗ ██████╗ 
██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝    ██╔══██╗██╔══██╗██╔══██╗
██████╔╝██║   ██║███████╗   ██║       ███████║██║  ██║██║  ██║
██╔═══╝ ██║   ██║╚════██║   ██║       ██╔══██║██║  ██║██║  ██║
██║     ╚██████╔╝███████║   ██║       ██║  ██║██████╔╝██████╔╝
╚═╝      ╚═════╝ ╚══════╝   ╚═╝       ╚═╝  ╚═╝╚═════╝ ╚═════╝                                                            
*/

app.post("/add", (req, res) => {
  const body = req.body || {};
  const name = body.name;
  const description = body.description || null;
  const category = body.category || null;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const query = db.prepare("INSERT INTO products (name, description, category) VALUES (?, ?, ?)");
  const result = query.run(name, description, category);

  const product = findProduct(result.lastInsertRowid);
  res.status(201).json(product);
});

/*
██████╗ ██╗   ██╗████████╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗███████╗    ██╗██╗██████╗ 
██╔══██╗██║   ██║╚══██╔══╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝   ██╔╝██║██╔══██╗
██████╔╝██║   ██║   ██║       ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ███████╗  ██╔╝ ██║██║  ██║
██╔═══╝ ██║   ██║   ██║       ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ╚════██║ ██╔╝  ██║██║  ██║
██║     ╚██████╔╝   ██║       ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ███████║██╔╝   ██║██████╔╝
╚═╝      ╚═════╝    ╚═╝       ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚══════╝╚═╝    ╚═╝╚═════╝ 
*/                                                                                                          

app.put("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidId(id)) {
    return res.status(400).json({ error: "Veuillez rentrer un ID de produit valide !" });
  }

  if (!findProduct(id)) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  const body = req.body || {};
  const name = body.name;
  const description = body.description || null;
  const category = body.category || null;

  const query = db.prepare("UPDATE products SET name = ?, description = ?, category = ? WHERE id = ?");
  query.run(name, description, category, id);

  res.json(findProduct(id));
});

/*
██████╗  █████╗ ████████╗ ██████╗██╗  ██╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗███████╗    ██╗██╗██████╗ 
██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝   ██╔╝██║██╔══██╗
██████╔╝███████║   ██║   ██║     ███████║    ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ███████╗  ██╔╝ ██║██║  ██║
██╔═══╝ ██╔══██║   ██║   ██║     ██╔══██║    ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ╚════██║ ██╔╝  ██║██║  ██║
██║     ██║  ██║   ██║   ╚██████╗██║  ██║    ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ███████║██╔╝   ██║██████╔╝
╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚══════╝╚═╝    ╚═╝╚═════╝ 
*/                                                                                                                         

app.patch("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidId(id)) {
    return res.status(400).json({ error: "Veuillez rentrer un ID de produit valide !" });
  }

  const product = findProduct(id);
  if (!product) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  const body = req.body || {};
  if (body.name === undefined && body.description === undefined && body.category === undefined) {
    return res.status(400).json({ error: "Aucun champ à modifier" });
  }

  let name = product.name;
  let description = product.description;
  let category = product.category;

  if (body.name !== undefined) {
    name = body.name;
  }
  if (body.description !== undefined) {
    description = body.description;
  }
  if (body.category !== undefined) {
    category = body.category;
  }

  const query = db.prepare("UPDATE products SET name = ?, description = ?, category = ? WHERE id = ?");
  query.run(name, description, category, id);

  res.json(findProduct(id));
});

/*
██████╗ ███████╗██╗     ███████╗████████╗███████╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗███████╗    ██╗██╗██████╗ 
██╔══██╗██╔════╝██║     ██╔════╝╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝   ██╔╝██║██╔══██╗
██║  ██║█████╗  ██║     █████╗     ██║   █████╗      ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ███████╗  ██╔╝ ██║██║  ██║
██║  ██║██╔══╝  ██║     ██╔══╝     ██║   ██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ╚════██║ ██╔╝  ██║██║  ██║
██████╔╝███████╗███████╗███████╗   ██║   ███████╗    ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ███████║██╔╝   ██║██████╔╝
╚═════╝ ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚══════╝╚═╝    ╚═╝╚═════╝ 
*/

app.delete("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidId(id)) {
    return res.status(400).json({ error: "Veuillez rentrer un ID de produit valide !" });
  }

  const query = db.prepare("DELETE FROM products WHERE id = ?");
  const result = query.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  res.status(204).send();
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
