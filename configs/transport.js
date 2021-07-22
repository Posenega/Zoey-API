const nodemailer = require("nodemailer");
const config = require("./auth.config");

const user = config.user;
const pass = config.pass;

const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
  transport
    .sendMail({
      from: user,
      to: email,
      subject: "Please confirm your account",
      html: `<div
        style="
          text-align: center;
          background-color: #ffc300;
          text-decoration: none;
          font-family: Arial, Helvetica, sans-serif;
          padding: 1rem;
        "
      >
        <div style="background-color: white; padding: 5rem">
          <h1 style="margin: 0; color: black">Hello ${name}!</h1>
          <p style="color: black">
            Thank you for joining us. Please confirm your email by entering the
            following code in the app to get in!
          </p>
          <b style="font-size: xx-large">${confirmationCode}</b>
        </div>
      </div>`,
    })
    .catch((err) => console.log(err));
};
