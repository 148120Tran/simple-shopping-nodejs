const errorHandler = (next, err) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error); // this next(error) let express know an error occurs and it will skip all middleware and move right away to an err handling middleware
};

//or using high order func

// const errorHandler = next => err => {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(error);
// }

//.catch(errorHandler(next))

exports.errorHandler = errorHandler;
