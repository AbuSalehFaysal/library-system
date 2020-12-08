const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const User = require("./models/user");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");

//DATABASE CONNECTION
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connect("mongodb://localhost/RESTfulBlogApp");

//APP CONFIG
app.use(require("express-session")({
  secret: "Rusty is the best",
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
var blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  image: String,
  body: String,
  releasedate: String,
  status: String,
  created: { type: Date, default: Date.now },
});
var Blog = mongoose.model("Blog", blogSchema);

//TEST BLOG CREATION
// Blog.create({
//   title: "Test Blog",
//   image: "https://neilpatel.com/wp-content/uploads/2018/10/blog.jpg",
//   body: "This is a test blog!!!"
// });

//RESTFUL ROUTES
app.get("/", function (req, res) {
  res.redirect("/blogs");
});

//INDEX ROUTE
app.get("/blogs", function (req, res) {
  // console.log(req.user);
  Blog.find({}, function (err, blogs) {
    if (err) {
      console.log("ERROR: ");
      console.log(err);
    } else {
      res.render("index", { blogs: blogs, currentUser: req.user });
    }
  });
});

//NEW ROUTE
app.get("/blogs/new", function (req, res) {
  res.render("new");
});

//NEW ROUTE
app.get("/blogs/register", function (req, res) {
  res.render("register");
});

//NEW ROUTE
app.get("/blogs/login", function (req, res) {
  res.render("login");
});

//NEW ROUTE
app.get("/blogs/logout", function (req, res) {
  req.logout();
  res.redirect("/blogs/login");
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/blogs/login");
}

//handling user sign up 
app.post("/blogs/register", function(req, res){
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
        res.redirect('/blogs/login');
      });
    }
  });
}); 

//login logic 
app.post("/blogs/login", passport.authenticate("local", {
   successRedirect: "/blogs",
   failureRedirect: "/blogs/login"
  }),function(req, res){
});


//CREATE ROUTE
app.post("/blogs", function (req, res) {
  console.log(req.body);
  req.body.blog.body = req.sanitize(req.body.blog.body);
  console.log("========");
  console.log(req.body);
  Blog.create(req.body.blog, function (err, newBlog) {
    if (err) {
      console.log(err);
      res.renders("new");
    } else {
      res.redirect("/blogs");
    }
  });
});

//SHOW ROUTE
app.get("/blogs/:id", function (req, res) {
  // find the blog with provide id
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log(err);
    } else {
      res.render("show", { blog: foundBlog });
    }
  });
});

//EDIT ROUTE
app.get("/blogs/:id/edit", isLoggedIn, function (req, res) {
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log(err);
      res.redirect("/blogs");
    } else {
      res.render("edit", { blog: foundBlog });
    }
  });
});

app.get("/blogs/:id/deactivate", isLoggedIn, function (req, res) {
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log(err);
      res.redirect("/blogs");
    } else {
      res.render("deactivate", { blog: foundBlog });
    }
  });
});

app.get("/blogs/:id/activate", isLoggedIn, function (req, res) {
  Blog.findById(req.params.id, function (err, foundBlog) {
    if (err) {
      console.log(err);
      res.redirect("/blogs");
    } else {
      res.render("activate", { blog: foundBlog });
    }
  });
});

//UPDATE ROUTE
app.put("/blogs/:id", function (req, res) {
  req.body.blog.body = req.sanitize(req.body.blog.body);
  Blog.findByIdAndUpdate(
    req.params.id,
    req.body.blog,
    function (err, updatedBlog) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/blogs/" + req.params.id);
      }
    }
  );
});

//DELETE ROUTE
app.delete("/blogs/:id", isLoggedIn, function (req, res) {
  Blog.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/blogs");
    }
  });
});

app.listen(7000, function () {
  console.log("Server Has Started!!!");
});

// app.listen(process.env.PORT, process.env.IP);
