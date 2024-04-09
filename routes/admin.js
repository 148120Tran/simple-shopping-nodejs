const path = require("path");
const { check, body } = require("express-validator");

const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();
router.use(isAuth);

// /admin/add-product => GET
router.get("/add-product", adminController.getAddProduct);

// /admin/products => GET
router.get("/products", adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [body("title").not().isEmpty().withMessage("Title cant be empty.")],
  adminController.postAddProduct
);

router.get("/edit-product/:productId", adminController.getEditProduct);

router.post(
  "/edit-product",
  [body("title").not().isEmpty().withMessage("Title cant be empty.")],
  adminController.postEditProduct
);

// router.post("/delete-product", adminController.postDeleteProduct);
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
