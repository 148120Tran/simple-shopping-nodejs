const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const multer = require("multer");

const errorController = require("./controllers/error");
// const mongoConnect = require('./util/database').mongoConnect;
//this using mongodb driver
const User = require("./models/user");
const isAuth = require("./middleware/is-auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const MONGODB_URI =
  "mongodb+srv://nhattran:nhattran@clusters.weinpyx.mongodb.net/shop";

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    // cb(null, new Date().toISOString() + "-" + file.originalname); //Name of the file on the user's computer	;
    cb(null, Date.now() + "-" + file.originalname);
    //using Date to ensure the uniqueness
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // null as an error, and true as we accept those file, so it should be stored
  } else {
    cb(null, false); //false we dont want to store it
  }
};

app.use(express.urlencoded({ extended: false }));
// app.use(bodyParser.urlencoded({ extended: false }));
//false: simple data, true: complex data (arr,obj,nested obj)
//new version of express alr has bodyparser

//multer: parse incoming req for files or req with mixed data , text and file data
//Don't forget the enctype="multipart/form-data" in your form. when using multer
//same name as in view/edit-product
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    //store data accross req while still scoping them to the singler user not sharing data across users , => diff user got diff session
    secret: "my secret", //signing the hash, which secretly store our id in the cookie
    resave: false, // => the seession will not be saved on every req
    saveUninitialized: false,
    store: store, // => this session got store in mongodb
    // in this middleware we could also add cookie config in in/ cookie: {...}
  })
); // So in general, use a session for any data that belongs to a user that you don't want to lose after every response you send
//and that should not be visible to other users.

app.use(flash()); // now we can use flash anywhere on the req obj

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user; // this user is full mongoose model => we could call all mongoose func/method
      //store user in the req
      next();
    })
    .catch((err) => console.log(err));
}); // this middleware run on every incoming req before our route handle it(below) => data we use in here req.user = user is the same req cycle

// app.use((req, res, next) => {
//   req.isLoggedIn = req.cookies.isLoggedIn === "true";
//   next();
// });

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

//this is special type of middleware (error handling middleware) // it will move to this middleware when we pass next(error)
app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');

  // res.redirect("https://http.cat/500");
  console.log(error);

  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: !!req.session?.isLoggedIn,
  });
});

// mongoConnect(() => {
//   app.listen(3000);
// });
// this using mongodb driver

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // User.findOne().then((user) => {
    //   //if there was no condition in findOne() it will return an arbitrary document
    //   if (!user) {
    //     const user = new User({
    //       name: "Nhat",
    //       email: "nhattran@gmail.com",
    //       cart: {
    //         items: [],
    //       },
    //     });
    //     user.save();
    //   }
    // });

    app.listen(3000);
  })
  .catch((err) => {
    console.log("app", err);
  });
