const fs = require("fs");
const path = require("path");
const { renderProducts } = require("../util/pagination");

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const { errorHandler } = require("../util/erorrFunc");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 1;

// exports.getProducts = (req, res, next) => {
//   Product.find() //with mongoose Model.find() give all the document, not return the cursor like mongodb driver
//     .then((products) => {
//       console.log(products);
//       res.render("shop/product-list", {
//         prods: products,
//         pageTitle: "All Products",
//         path: "/products",
//         // isAuthenticated: req.session.isLoggedIn,
//       });
//     })
//     // .catch((err) => {
//     //   console.log(err);
//     // });
//     .catch((err) => {
//       errorHandler(next, err);
//     });
// };

//with pagination
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findById(prodId) //findById() is the method in mongoose
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      errorHandler(next, err);
    });
};

// exports.getIndex = (req, res, next) => {
//   return renderProducts(req, res, next, "shop/index", {
//     pageTitle: "Shop",
//     path: "/",
//   });
// };

// exports.getIndex = (req, res, next) => {
//   const page = +req.query.page || 1;

//   Product.find()
//     .skip((page - 1) * ITEMS_PER_PAGE)
//     .limit(ITEMS_PER_PAGE)
//     .then((products) => {
//       Product.countDocuments()
//         .then((totalProductsCount) => {
//           const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
//           return {
//             totalPages: pagesCount,
//             currPage: page,
//             hasPrev: page > 1,
//             hasNext: page < pagesCount,
//           };
//         })
//         .then((pagingData) => {
//           res.render("shop/index", {
//             products: products,
//             pageTitle: "All Products",
//             path: "/shop",
//             pagination: pagingData,
//           });
//         });
//     })
//     .catch(console.log);
// };
// second above -> need some improment

// max's code below and it worked

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  // if we still use req.session.user we should add
  // exports.getCart = (req, res, next) => {
  //   req.session.user = new User().init(req.session.user); // should add this line so it will bring back all the func/method of mongoose
  //   req.session.user
  //   .populate('cart.items.productId')
  req.user //// Given a document, `populate()` lets you pull in referenced docs
    .populate("cart.items.productId")
    .then((user) => {
      console.log("this is log getCart", user.cart.items);
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      errorHandler(next, err);
    });
  // .catch((err) => {
  //   const error = new Error(err);
  //   error.httpStatusCode = 500;
  //   return next(error);
  // });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    // .catch((err) => console.log(err));
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.postOrder = (req, res, next) => {
  req.user //// Given a document, `populate()` lets you pull in referenced docs
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }; //productId hold the full object not just id
        /*
        1)  i.productId => includes everything, metadata, etc.... (But console.log doesn't show it)
2) ._doc, (i.productId._doc) => breaks it down and only includes the main data, which is the product data, and stores it in "i.productId"
The _doc field lets you access the "raw" document directly
3) "..." operator => (PULLS IT) TAKES A COPY of PRODUCT DATA that is is stored in "i.product" and stores it inside the {} braces.
         */
      });
      // const order = new Order({
      //   user: req.user.name,
      //   userId: req.user._id,
      //   products: products,
      // });

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    // .catch((err) => console.log(err));
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    // .catch((err) => console.log(err));
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("---");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Disposition',
      //     'inline; filename="' + invoiceName + '"'
      //   );
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};
