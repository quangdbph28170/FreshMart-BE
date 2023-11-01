export const responseSender = (req, res, next) => {
  const data = {};
  data.body = { data: req.responseObj };
  data.status = req.responseStatus || 200;
  data.message = req.responseMessage || "Success";
  return res.status(data.status).json(data);
};

export const typeRequestMw = {
  RESPONSE_OBJ: "responseObj",
  RESPONSE_STATUS: "responseStatus",
  RESPONSE_MESSAGE: "responseMessage",
};
