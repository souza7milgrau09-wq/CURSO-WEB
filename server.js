require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./database");

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "supersegredo123",
  resave: false,
  saveUninitialized: false
}));

app.use(express.static("public"));

/* ===== MERCADO PAGO CONFIG ===== */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* ===== CADASTRO ===== */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hash],
    function(err){
      if(err) return res.send("Erro ao registrar");
      res.redirect("/login.html");
    }
  );
});

/* ===== LOGIN ===== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if(!user) return res.send("Usuário não encontrado");

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.send("Senha incorreta");

    req.session.userId = user.id;

    if(user.pagou === 1){
      res.redirect("/dashboard");
    } else {
      res.redirect("/pagamento.html");
    }
  });
});

/* ===== PROTEGER DASHBOARD ===== */
app.get("/dashboard", (req, res) => {
  if(!req.session.userId) return res.redirect("/login.html");

  db.get("SELECT pagou FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if(user && user.pagou === 1){
      res.sendFile(__dirname + "/public/dashboard.html");
    } else {
      res.redirect("/pagamento.html");
    }
  });
});

/* ===== CRIAR PAGAMENTO ===== */
app.post("/criar-pagamento", async (req, res) => {

  if(!req.session.userId) return res.redirect("/login.html");

  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: [
        {
          title: "Formação DevMaster Pro",
          unit_price: 197,
          quantity: 1
        }
      ],
      external_reference: req.session.userId.toString(),
      back_urls: {
        success: "http://localhost:3000/sucesso",
        failure: "http://localhost:3000/pagamento.html"
      },
      auto_return: "approved"
    }
  });

  res.json({ id: response.id });
});

/* ===== CONFIRMAR PAGAMENTO ===== */
app.get("/sucesso", async (req, res) => {

  const payment_id = req.query.payment_id;

  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: payment_id });

  if(payment.status === "approved"){

    const userId = payment.external_reference;

    db.run("UPDATE users SET pagou = 1 WHERE id = ?", [userId]);

    res.redirect("/dashboard");

  } else {
    res.redirect("/pagamento.html");
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});