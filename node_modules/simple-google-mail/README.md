# simple-google-mail
A utility for handling authentication and retrieval of google mail data.

## Installation
`npm install simple-google-mail`

## Prerequisite Configuration
Go to https://developers.google.com/gmail/api/quickstart/nodejs and click `ENABLE THE GMAIL API`.
Copy your credentials.json file to the `CREDENTIALS_PATH` specified in the `config` to the `SimpleGoogleMail` constructor.

## Example Usage

First Time Through, the app will prompt you to create the `google-mail-token.json` file by following the steps presented.

```
const {SimpleGoogleMail} = require('simple-google-mail');

const mail = new SimpleGoogleMail({
    SCOPES: ['https://mail.google.com/'],
    CREDENTIALS_PATH: './credentials/google-mail-credentials.json',
    TOKEN_PATH: './credentials/google-mail-token.json',
    MAIL_OUTPUT_PATH: './output/mail'
});

let recentMail = mail.processRecentEmailWithCredentials();
```
