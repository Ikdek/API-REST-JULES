const db = require("./db");
const { hashPassword } = require("./auth");
const { ROLES } = require("./perm");

const TEST_USERS = [
  { username: "admin_test", password: "admin123", role: ROLES.ADMIN },
  { username: "manager_test", password: "manager123", role: ROLES.MANAGER },
  { username: "client_test", password: "client123", role: ROLES.CLIENT },
  { username: "client_test2", password: "client123", role: ROLES.CLIENT },
];

const TEST_PRODUCTS = [
  { name: "Clavier mécanique", description: "Clavier 75% switches rouges", category: "Informatique" },
  { name: "Souris sans fil", description: "Souris ergonomique 2.4 GHz", category: "Informatique" },
  { name: "Cafetière", description: "Cafetière à filtre 12 tasses", category: "Cuisine" },
  { name: "Lampe de bureau", description: "Lampe LED orientable", category: "Maison" },
  { name: "Casque audio", description: "Casque Bluetooth à réduction de bruit", category: "Audio" },
];

for (const user of TEST_USERS) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(user.username);
  if (existing) {
    db.prepare("UPDATE users SET password = ?, role = ? WHERE id = ?").run(hashPassword(user.password), user.role, existing.id);
    console.log(`Utilisateur "${user.username}" réinitialisé (${user.role})`);
  } else {
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(user.username, hashPassword(user.password), user.role);
    console.log(`Utilisateur "${user.username}" créé (${user.role})`);
  }
}

const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get();
if (count === 0) {
  const query = db.prepare("INSERT INTO products (name, description, category) VALUES (?, ?, ?)");
  for (const product of TEST_PRODUCTS) {
    query.run(product.name, product.description, product.category);
  }
  console.log(`${TEST_PRODUCTS.length} produits créés`);
} else {
  console.log(`Table products déjà remplie (${count} produits), rien à ajouter`);
}
