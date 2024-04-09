// we got btn as argument cuz we pass this in ejs file(products.ejs)
const deleteProduct = (btn) => {
  // access to the parent node of the btn which is the div class="card__Action"
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  //got the value which is productid in input
  //or we could just pass <%= product._id %> in the ejs file

  const productElement = btn.closest("article");

  //this fetch could sending http req
  fetch("/admin/product/" + prodId, {
    method: "DELETE",
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      //   productElement.parentNode.removeChild(productElement);
      productElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};
