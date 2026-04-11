const filterObj = (obj, ...allowedFields) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      let value = obj[el];
      if (typeof value === 'string') {
        value = value.trim();
      }
      newObj[el] = value;
    }
  });
  return newObj;
};
module.exports = filterObj;