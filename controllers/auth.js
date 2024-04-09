const User = require("../models/user");
const crypto = require("crypto"); // this lib help us create unique randome value secure
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dummyemail148120@gmail.com",
    pass: "nysn jbii olqj xebk", //login with app password/ ref:https://stackoverflow.com/questions/60701936/error-invalid-login-application-specific-password-required/60718806#60718806
  },
});

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

exports.getLogin = (req, res, next) => {
  // console.log("flash message here", req.flash("error")); // it give empty array []
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  // const isLoggedIn =
  //   req.get("Cookie").split(";")[0].trim().split("=")[1] === "true";
  console.log(req.session);
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login page",
    // isAuthenticated: false,
    errorMessage: message, // req.flash("error"), // accessing the key in flash()
    // errorMessage: req.flash('error')[0] //as it returns an array  of messages, so if no message it will return undefined
    // this is other way to checked error message // or we could check the lenght in ejs file
    oldInput: {
      email: "",
      password: "",
    },
  });
};
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    // isAuthenticated: false,
    errorMessage: req.flash("error")[0], //this is other way
    // errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  // res.setHeader("Set-Cookie", "loggedIn=true");
  // res.cookie("loggedIn", "true", { httpOnly: true });
  // req.isLoggedIn = true; // this req is dead after the res
  // req.session.isLoggedIn = true; //this session is add on middleware in app.js
  // res.redirect("/");

  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //status 422: some data passed are in correct
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        // req.flash("error", "invalid email"); // take a key and value
        // return res.redirect("/login");

        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password.",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          // req.flash("error", "invalid  password");
          // res.redirect("/login");
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

// User.findById("657ec01afc8862237bdb9248")
//   .then((user) => {
//     req.session.isLoggedIn = true;
//     req.session.user = user;
//     req.session.save((err) => {
//       console.log(err);
//       res.redirect("/");
//     });
//   })
//   .catch((err) => console.log(err));

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    //delete session in db, in broswer still have session but it won match or found
    res.redirect("/");
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email; //extract in4 from incoming req/ according to its name on View
  const password = req.body.password;
  // const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg, //first mesg
      oldInput: { email, password, confirmPassword: req.body.confirmPassword },
      validationErrors: errors.array(), //return full error of arr, not just first msg like above
      // we could change the styling of input base on the err
    });
  }
  // User.findOne({ email: email })
  //   .then((userDoc) => {
  //     if (userDoc) {
  //       req.flash("error", "email alr exits");

  //       // throw Error("email alr exits");
  //       return res.redirect("/signup");
  //     }
  // return (
  bcrypt //first arg take a string that u want to hash, second arg salt value: decide how many round of hashing will be
    //applied,higher value -> longer it take and more secure
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save(); //save data in db
    })
    .then((result) => {
      const mailOptions = {
        from: "dummyemail148120@gmail.com",
        to: email,
        subject: "Sending Email using Node.js",
        text: "That was easy sign up!",
      };
      res.redirect("/login");

      return transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    });
  // );
  // })
  // .catch((err) => console.log(err));
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "reset",
    pageTitle: "reset password",
    // isAuthenticated: false,

    errorMessage: req.flash("error")[0],
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      res.redirect("/reset");
    }
    const token = buffer.toString("hex"); // Chuyển buffer thành chuỗi hex
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "no email match");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; //1h
        return user.save(); //save these token in db
      })
      .then((result) => {
        transporter.sendMail({
          from: "shopnode@gmail.com",
          to: req.body.email,
          subject: "Password reset",
          html: `
        <p> Request rs password </p>
        <p> click the <a href="localhost:3000/reset/${token}">link </a> to reset </p>
        `,
        });
      })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "new password",
        // isAuthenticated: false,
        userId: user._id.toString(),
        errorMessage: req.flash("error")[0],
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// exports.postNewPassword = (req, res, next) => {
//   const {newPassword, userId, passwordToken} = req.body

// return bcrypt.hash(newPassword,12)
// .then(hashedPassword=>{
//     return User.updateOne({
//         resetToken: token,
//         resetTokenEx: {$gt: Date.now()},
//         _id:userId}
//         },{$set:{
//         password: hashedPassword,
//         resetToken: undefined,
//         resetTokenEx: undefined
//     }})
// })
// };

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
