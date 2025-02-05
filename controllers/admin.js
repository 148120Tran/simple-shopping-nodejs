const Product = require("../models/product");
const fileHelper = require("../util/file");

const { renderProducts } = require("../util/pagination");
const { errorHanlder, errorHandler } = require("../util/erorrFunc");
const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    validationErrors: [],
    hasError: false,

    // isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  // const imageUrl = req.body.imageUrl;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }

  const errors = validationResult(req); // collect all err

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/edit-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        // imageUrl: imageUrl,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path; //?

  // const product = new Product(
  //   title,
  //   price,
  //   description,
  //   imageUrl,
  //   null,
  //   req.user._id
  // );
  // this is using with mongodb driver
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl, // the right is from the data from req.body...., the left side from key in schema:(model)
    userId: req.user._id, //we store the user in the req  in app.js
  });
  //   const product = new Product({
  //     title,
  //     price,
  //     description,
  //     imageUrl
  // }); //es6 syntax
  //This shorthand allows you to omit the repetition of property names when they match the variable names.
  product
    .save() //this save is coming from mongoose/ not the one we create like in mongodb driver
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // this next(error) let express know an error occurs and it will skip all middleware and move right away to an err handling middleware
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId; //define that id of product need to edit
  Product.findById(prodId) // load that product
    // Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    // .catch((err) => console.log(err));
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  // const updatedImageUrl = req.body.imageUrl;
  const image = req.file;

  const updatedDesc = req.body.description;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  // const product = new Product(
  //   updatedTitle,
  //   updatedPrice,
  //   updatedDesc,
  //   updatedImageUrl,
  //   prodId
  // ); //with mongodb driver it creat a new product
  Product.findById(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      // product.imageUrl = updatedImageUrl;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save();
    })

    .then((result) => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};
// findByidandupdate method in mongoose
// Product.findByIdAndUpdate(prodId, {
//   title: updatedTitle,
//   price: updatedPrice,
//   description: updatedDesc,
//   imageUrl: updatedImageUrl
// }, { new: true }) // { new: true } returns the updated document
//   .then(updatedProduct => {
//       // Handle the updated product here
//   })
//   .catch(error => {
//       // Handle errors here
//   });

// exports.getProducts = (req, res, next) => {
//   Product.find() //zzz { userId: req.use._id }
//     // .select("title price -_id") // could control which fiel will be return / title, price , exclusive id
//     // .populate("userId", "name") //populate the related field and fetch the related data
//     .then((products) => {
//       // console.log(products);
//       res.render("admin/products", {
//         prods: products,
//         pageTitle: "Admin Products",
//         path: "/admin/products",
//         // isAuthenticated: req.session.isLoggedIn,
//       });
//     })
//     // .catch((err) => console.log(err));
//     .catch((err) => {
//       errorHandler(next, err);
//     });
// };

exports.getProducts = async (req, res, next) => {
  //   Product.find() //zzz { userId: req.use._id }
  //     // .select("title price -_id") // could control which fiel will be return / title, price , exclusive id
  //     // .populate("userId", "name") //populate the related field and fetch the related data
  try {
    const products = await Product.find();
    res.status(200).render("admin/products", {
      prods: products,
      pageTitle: "Admin Products",
      path: "/admin/products",
    });
  } catch (err) {
    errorHandler(next, err);
  }
};

// somehow cant include file in pagination
// exports.getProducts = (req, res, next) => {
//   renderProducts(req, res, next, "admin/products", {
//     pageTitle: "Products",
//     path: "/admin/products",
//   });
// };

// exports.deleteProduct = (req, res, next) => {
//   const prodId = req.params.productId;
//   Product.findByIdAndDelete(prodId)

//     .then(() => {
//       console.log("DESTROYED PRODUCT");
//       res.status(200).json({ message: "Success!" }); //passing js obj here will be automaticly transform to json
//     })
//     // .catch((err) => console.log(err));
//     .catch((err) => {
//       // errorHandler(next, err);
//       res.status(500).json({ message: "Deleting product failed." });
//     });
// };

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).json({ message: "Success" }); //passing js obj here will be automaticly transform to json
  } catch (err) {
    res.status(500).json({ message: "Deleting product failed." });
  }
};

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   Product.findById(prodId)
//     .then(product => {
//       if (!product) {
//         return next(new Error('Product not found.'));
//       }
//       fileHelper.deleteFile(product.imageUrl);
//       return Product.deleteOne({ _id: prodId, userId: req.user._id });
//     })
//     .then(() => {
//       console.log('DESTROYED PRODUCT');
//       res.redirect('/admin/products');
//     })
//     .catch(err => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };
