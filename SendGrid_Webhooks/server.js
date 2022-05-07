const bodyParser = require("body-parser"); // With Express 4.16+ you do not need this and can use express.json() and express.raw() instead
const unless = require('express-unless');
const express = require('express');
const { EventWebhook } = require("@sendgrid/eventwebhook");
// const functions = require("firebase-functions");
const app = express();

class EventWebhookHeader {
  static SIGNATURE() {
    return 'X-Twilio-Email-Event-Webhook-Signature';
  }

  static TIMESTAMP() {
    return 'X-Twilio-Email-Event-Webhook-Timestamp';
  }
};



const verifyRequest = function (publicKey, payload, signature, timestamp) {
  const eventWebhook = new EventWebhook();
  const ecPublicKey = eventWebhook.convertPublicKeyToECDSA(publicKey);
  return eventWebhook.verifySignature(ecPublicKey, payload, signature, timestamp);
}

// Exclude the webhook path from any json parsing
const json_parser = bodyParser.json();
const port = 3000;

json_parser.unless = unless;
app.use(json_parser.unless({ path: ["/sendgrid/webhook"]}));

app.post("/sendgrid/webhook",
  // parse req.body as a Buffer
  bodyParser.raw({ type: 'application/json' }),
  async (req, resp) => {
    try {
      const key = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6hdTKc/oNoWiQMj2kxaBu/HCI27/hKurVpmYcOR2dfXoi7piUHuUf04EJT6Iu/nf6MZwZOexSiTAgvN+iiR56Q==';
      // Alternatively, you can get your key from your firebase function cloud config
      // const key = getConfig().sendgrid.webhook_verification_key;
      const signature = req.get(EventWebhookHeader.SIGNATURE());
      const timestamp = req.get(EventWebhookHeader.TIMESTAMP());

      // const bodyPayload = req.rawBody.toString();

      // Be sure to _not_ remove any leading/trailing whitespace characters (e.g., '\r\n').
      const requestBody = req.body;
      // Alternatively, if using firebase cloud functions, remove the middleware and use:
      // const requestBody = (req as functions.https.Request).rawBody;
      console.log(key);
      console.log(requestBody);
      console.log(req.headers);
      console.log(timestamp);


      if (verifyRequest(key, requestBody, signature, timestamp)) {
        resp.sendStatus(204);
      } else {
        resp.sendStatus(403);
      }
    } catch (error) {
      console.log(error);
      resp.status(500).send(error);
    }
});

app.listen(port, () => {
  console.log(`SendGrid_Webhooks app listening on port ${port}`);
});