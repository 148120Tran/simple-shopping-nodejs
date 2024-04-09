const Product = require("../models/product");

const ITEMS_PER_PAGE = 1;

exports.renderProducts = (req, res, next, renderPath, object = {}) => {
  const page = req.query.page;
  let totalItems;
  const set = object;
  return Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      return res.render(renderPath, {
        ...set,
        totalItems,
        prods: products,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hesPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => console.log(err));
};
