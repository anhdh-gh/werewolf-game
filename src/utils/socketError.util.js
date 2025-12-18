module.exports = (errorConstant) => {
  const err = new Error(errorConstant.message);
  err.code = errorConstant.code;
  return err;
};
