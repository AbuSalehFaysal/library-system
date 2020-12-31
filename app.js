const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/user");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require('swagger-ui-express');
const app = express();

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Library Management System",
      version: "1.0.1",
      description: "My Library",
      contact: {
        name: "Abu Saleh Faysal"
      },
      servers: ["http://localhost:7000"]
    },
    swagger: "2.0",
    paths: {}
  },
  apis: ["app.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//DATABASE CONNECTION
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connect("mongodb://localhost/RESTfulBlogApp");

//APP CONFIG
app.use(require("express-session")({
  secret: "Faysal is the best",
  resave: false,
  saveUninitialized: false
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});

//SCHEMA/MODEL SETUP
var bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  image: String,
  body: String,
  releasedate: String,
  status: String,
  created: { type: Date, default: Date.now },
});
var Book = mongoose.model("Book", bookSchema);

var listSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  name: String,
});
var List = mongoose.model("List", listSchema);

//TEST Book CREATION
// Book.create({
//   title: "Test Book",
//   image: "https://neilpatel.com/wp-content/uploads/2018/10/Book.jpg",
//   body: "This is a test Book!!!"
// });

//RESTFUL ROUTES

/**
 * @swagger
 * /:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/", function (req, res) {
  res.redirect("/books");
  res.status(200);
});

//INDEX ROUTE

/**
 * @swagger
 * /books:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books", function (req, res) {
  // console.log(req.user);
  Book.find({}, function (err, books) {
    if (err) {
      console.log("ERROR: ");
      console.log(err);
    } else {
      res.render("index", { books: books, currentUser: req.user });
      res.status(200);
    }
  });
});

app.get("/books/deactivatedbooks", function (req, res) {
  // console.log(req.user);
  Book.find({}, function (err, books) {
    if (err) {
      console.log("ERROR: ");
      console.log(err);
    } else {
      res.render("deactivatedbooks", { books: books, currentUser: req.user });
      res.status(200);
    }
  });
});

/**
 * @swagger
 * /books/allbooks:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/allbooks", function (req, res) {
  // console.log(req.user);
  Book.find({}, function (err, books) {
    if (err) {
      console.log("ERROR: ");
      console.log(err);
    } else {
      res.render("allbooks", { books: books, currentUser: req.user });
    }
  });
});

//NEW ROUTE

/**
 * @swagger
 * /books/new:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/new", function (req, res) {
  res.render("new");
});

//NEW ROUTE

/**
 * @swagger
 * /books/register:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/register", function (req, res) {
  res.render("register");
});

//NEW ROUTE

/**
 * @swagger
 * /books/login:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/login", function (req, res) {
  res.render("login");
});

//NEW ROUTE

/**
 * @swagger
 * /books/logout:
 *   get:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/logout", function (req, res) {
  req.logout();
  res.redirect("/books/login");
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/books/login");
}

//handling user sign up

/**
 * @swagger
 * /books/register:
 *   post:
 *     description:  Get All Books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.post("/books/register", function(req, res){
  User.register((
    {usertype: req.body.usertype,
    username: req.body.username,
  }),
    req.body.password,
    (err, user) => {
    if (err) {
      console.log(err);
      return res.render("register");
    } else {
      passport.authenticate('local')(req, res, () =>{
        res.redirect('/books/login');
      });
    }
  });
}); 

//login logic 

app.post("/books/login", passport.authenticate("local", {
   successRedirect: "/books",
   failureRedirect: "/books/login"
  }),function(req, res){
});


//CREATE ROUTE

/**
 * @swagger
 * /books:
 *   post:
 *     description:  Insert a book info
 *     responses:
 *      '200':
 *        description: Success 
 */

app.post("/books", function (req, res) {
  console.log(req.body);
  req.body.book.body = req.sanitize(req.body.book.body);
  console.log("========");
  console.log(req.body);
  Book.create(req.body.book, function (err, newBlog) {
    if (err) {
      console.log(err);
      res.renders("new");
    } else {
      res.redirect("/books");
    }
  });
});

/**
 * @swagger
 * /books/list:
 *   get:
 *     description:  Get the list of books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/list", function(req, res){
  List.find({}, function (err, lists) {
    if (err) {
      console.log("ERROR: ");
      console.log(err);
    } else {
      res.render("list", { lists: lists});
    }
  });
});

/**
 * @swagger
 * /books/list:
 *   post:
 *     description:  Get the list of books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.post("/books/list", function (req, res) {
  List.create(req.body.list, function (err, newList) {
    if (err) {
      console.log(err);
      res.redirect("/books");
    } else {
      res.redirect("/books/list");
    }
  });
});

//SHOW ROUTE

/**
 * @swagger
 * /books/5fd1bce491b93c2db4c9676f:
 *   get:
 *     description:  Get the list of books
 *     responses:
 *      '200':
 *        description: Success 
 */

app.get("/books/:id", function (req, res) {
  // find the book with provide id
  Book.findById(req.params.id, function (err, foundBook) {
    if (err) {
      console.log(err);
    } else {
      res.render("show", { book: foundBook });
    }
  });
});

//EDIT ROUTE
app.get("/books/:id/edit", isLoggedIn, function (req, res) {
  Book.findById(req.params.id, function (err, foundBook) {
    if (err) {
      console.log(err);
      res.redirect("/books");
    } else {
      res.render("edit", { book: foundBook });
    }
  });
});

app.get("/books/:id/request", isLoggedIn, function (req, res) {
  Book.findById(req.params.id, function (err, foundBook) {
    if (err) {
      console.log(err);
      res.redirect("/books");
    } else {
      res.render("request", { book: foundBook });
    }
  });
});

app.get("/books/:id/deactivate", isLoggedIn, function (req, res) {
  Book.findById(req.params.id, function (err, foundBook) {
    if (err) {
      console.log(err);
      res.redirect("/books");
    } else {
      res.render("deactivate", { Book: foundBook });
    }
  });
});

app.get("/books/:id/activate", isLoggedIn, function (req, res) {
  Book.findById(req.params.id, function (err, foundBook) {
    if (err) {
      console.log(err);
      res.redirect("/books");
    } else {
      res.render("activate", { Book: foundBook });
    }
  });
});

//UPDATE ROUTE
app.put("/books/:id", function (req, res) {
  req.body.book.body = req.sanitize(req.body.book.body);
  Book.findByIdAndUpdate(
    req.params.id,
    req.body.book,
    function (err, updatedBlog) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/books/" + req.params.id);
      }
    }
  );
});

//DELETE ROUTE
app.delete("/books/:id", isLoggedIn, function (req, res) {
  Book.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/books");
    }
  });
});

app.listen(7000, function () {
  console.log("Server Has Started!!!");
});

// app.listen(process.env.PORT, process.env.IP);
