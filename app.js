const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const TWO_HOURS = 1000 * 60 * 60 * 2;

// eslint-disable-next-line no-undef
const {
  PORT = 3004,
  SEEE_LIFETIME = TWO_HOURS,
  NODE_ENV = "development",
  SESS_NAME = "sid",
  SESS_SECRET = "ssh!quiet,it'asecret",
} = process.env;

const IN_PROD = NODE_ENV === "production";

const users = [
  { id: 1, name: "Stephen", email: "test@gmail.com", password: "secret" },
];

const app = express();

// Middleware
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SEEE_LIFETIME,
      sameSite: true,
      secure: IN_PROD,
    },
  })
);

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/home");
  } else {
    next();
  }
};

app.use((req, res, next) => {
  const { userId } = req.session;
  if (userId) {
    res.locals.user = users.find((user) => user.id === userId);
  }
  next();
});

// Routing
app.get("/", (req, res) => {
  const { userId } = req.session;

  res.send(`
  <h1>Welcome</h1>
  ${
    userId
      ? `
      <a href='/home'>Home</a>
      <form method= 'post' action= '/logout'>
        <button>Logout</button>
      </form>
      `
      : `
  <a href='/login'>Login</a>
  <a href='/register'>Register</a>
  `
  }

  
  `);
});

app.get("/home", redirectLogin, (req, res) => {
  const { user } = res.locals;
  res.send(`
  <h1>Home</h1> 
  <a href='/'>Main</a>
  <ul> 
    <li>Name: ${user.name}</li>
    <li>Email: ${user.email}</li>   
  </ul>
  `);
});

app.get("/login", redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method= 'post' action= '/login'>
      <input type 'email' name='email' placeholder='Email' required />
      <input type 'password' name='password' placeholder='password' required />
      <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `);
});

app.get("/register", redirectHome, (req, res) => {
  res.send(`
  <h1>Register</h1>
  <form method= 'post' action= '/register'>
    <input type 'Name' name='name' placeholder='Name' required />  
    <input type 'email' name='email' placeholder='Email' required />
    <input type 'password' name='password' placeholder='password' required />
    <input type='submit' />
  </form>
  <a href='/login'>Login</a>
  `);
});

app.post("/login", redirectHome, (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const user = users.find(
      (user) => user.email === email && user.password === password
    );
    if (user) {
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }

  res.redirect("/login");
});

app.post("/register", redirectHome, (req, res) => {
  const { name, email, password } = req.body;

  if (name && email && password) {
    const exists = users.some((user) => user.email === email);

    if (!exists) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password,
      };

      users.push(user);

      req.session.userId = user.id;

      return res.redirect("/home");
    }
  }
  res.redirect("/register");
});

app.post("/logout", redirectLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.redirect("/home");
    }

    res.clearCookie(SESS_NAME);
    res.redirect("/login");
  });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
