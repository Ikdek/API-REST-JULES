const express = require("express");
const db = require("./db");
const { hashPassword, verifyPassword, generateToken, authenticate } = require("./auth");
const { ROLES, authorize } = require("./perm");
const { schemas, validate } = require("./validation");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(ROLES.ADMIN, existing.id);
    return;
  }

  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hashPassword(password), ROLES.ADMIN);
  console.log(`Administrateur "${username}" créé`);
}

seedAdmin();

function findProduct(id) {
  const query = db.prepare("SELECT * FROM products WHERE id = ?");
  return query.get(id);
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

/*
 █████╗ ██╗   ██╗████████╗██╗  ██╗
██╔══██╗██║   ██║╚══██╔══╝██║  ██║
███████║██║   ██║   ██║   ███████║
██╔══██║██║   ██║   ██║   ██╔══██║
██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
*/

app.post("/register", validate(schemas.register), (req, res) => {
  const { username, password } = req.body;

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
  }

  const query = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  const result = query.run(username, hashPassword(password), ROLES.CLIENT);

  res.status(201).json({ id: result.lastInsertRowid, username, role: ROLES.CLIENT });
});

app.post("/login", validate(schemas.login), (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  res.json({ token: generateToken(user), expiresIn: 300, role: user.role });
});

/*
██╗   ██╗███████╗███████╗██████╗ ███████╗
██║   ██║██╔════╝██╔════╝██╔══██╗██╔════╝
██║   ██║███████╗█████╗  ██████╔╝███████╗
██║   ██║╚════██║██╔══╝  ██╔══██╗╚════██║
╚██████╔╝███████║███████╗██║  ██║███████║
 ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝
*/

app.get("/users", authenticate, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users").all();
  res.json(users);
});

app.patch("/users/:id/role", authenticate, validate(schemas.idParam, "params"), validate(schemas.role), (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (id === req.user.sub) {
    return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre rôle" });
  }

  const result = db.prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  res.json(db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(id));
});

/*
 ██████╗ ███████╗████████╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗███████╗
██╔════╝ ██╔════╝╚══██╔══╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝
██║  ███╗█████╗     ██║       ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ███████╗
██║   ██║██╔══╝     ██║       ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ╚════██║
╚██████╔╝███████╗   ██║       ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ███████║
 ╚═════╝ ╚══════╝   ╚═╝       ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚══════╝                                                                                           
 */                                                          

app.get("/products", authenticate, authorize("products:read"), validate(schemas.productQuery, "query"), (req, res) => {
  const { id } = req.query;
  if (id === undefined) {
    const products = db.prepare("SELECT * FROM products").all();
    return res.json(products);
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

app.post("/add", authenticate, authorize("products:create"), validate(schemas.productCreate), (req, res) => {
  const body = req.body;
  const name = body.name;
  const description = body.description || null;
  const category = body.category || null;

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

app.put("/products/:id", authenticate, authorize("products:update"), validate(schemas.idParam, "params"), validate(schemas.productCreate), (req, res) => {
  const { id } = req.params;

  if (!findProduct(id)) { 
    return res.status(404).json({ error: "Produit introuvable" });
  }

  const body = req.body;
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

app.patch("/products/:id", authenticate, authorize("products:update"), isCreatedByUser(), validate(schemas.idParam, "params"), validate(schemas.productUpdate), (req, res) => {
  const { id } = req.params;

  const product = findProduct(id);
  if (!product) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  const body = req.body;
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

app.delete("/products/:id", authenticate, authorize("products:delete"), validate(schemas.idParam, "params"), (req, res) => {
  const { id } = req.params;

  const query = db.prepare("DELETE FROM products WHERE id = ?");
  const result = query.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  res.status(204).send();
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Le corps de la requête n'est pas un JSON valide" });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
