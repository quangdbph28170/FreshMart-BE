import dotenv from "dotenv";
import { createHmac } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import https from "https";
dotenv.config();

const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_CODE;
const secretKey = process.env.MOMO_SECRET_KEY;
const requestId = uuidv4();
const returnUrl = process.env.RETURN_URL;
const notifyUrl = process.env.NOTIFY_URL;
const requestType = "captureMoMoWallet";

const createSignature = (amount, orderId, orderInfo, extraData) => {
  const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}
  &requestId=${requestId}&amount=${amount}&orderId=${orderId}
  &orderInfo=${orderInfo}&returnUrl=${returnUrl}&notifyUrl=${notifyUrl}
  &extraData=${extraData}`;
  const signature = createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  return signature;
};

export const handleTransaction = ({
  amount,
  orderId,
  orderInfo,
  extraData,
}) => {
  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    extraData,
    returnUrl,
    notifyUrl,
    requestType,
    signature: createSignature(amount, orderId, orderInfo, extraData),
    extraData,
  });
  const options = {
    hostname: process.env.MOMO_DOMAIN,
    path: "/gw_payment/transactionProcessor",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };
  return new Promise((resolve, rejects) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      return;
      let responseBody = {};
      res.setEncoding("utf8");
      res.on("data", (body) => {
        console.log("Body: ");
        console.log(body);
        console.log("resultCode: ");
        console.log(JSON.parse(body).resultCode);
        responseBody = body;
      });
      res.on("end", () => {
        resolve(JSON.stringify(responseBody));
      });
    });

    req.on("error", (e) => {
      rejects(e.message);
    });
    req.write(requestBody);
    req.end();
  });
};
