exports.get404 = (req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: !!req.session?.isLoggedIn,
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: !!req.session?.isLoggedIn,
  });
};

/*
It's using the !! to convert the value of req.session?.isLoggedIn (which might be true, false, or possibly undefined) into a boolean. 
This ensures that isAuthenticated will always hold a boolean value (true or false). If req.session?.isLoggedIn is undefined,
the !! will coerce it to false. If it has any other value (e.g., true), it will be converted to true. The ?. (optional chaining operator) 
is used to safely access the isLoggedIn property in case req.session is null or undefined. 
*/
