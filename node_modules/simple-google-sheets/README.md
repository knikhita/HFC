# simple-google-sheets
A utility for handling authentication and retrieval of google sheets data.

## Installation
`npm install simple-google-sheets`

## Prerequisite Configuration
Go to https://developers.google.com/sheets/api/quickstart/nodejs and click `ENABLE THE GOOGLE SHEETS API`.
Copy your credentials.json file to the `CREDENTIALS_PATH` specified in the `config` to the `SimpleGoogleSheets` constructor.

## Example Usage

First Time Through, the app will prompt you to create the `google-sheets-token.json` file by following the steps presented.

```
const {SimpleGoogleSheets} = require('simple-google-sheets');

const sheets = new SimpleGoogleSheets({
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    CREDENTIALS_PATH: './credentials/google-sheets-credentials.json',
    TOKEN_PATH: './credentials/google-sheets-token.json'
});

let rows = sheets.getRowsWithCredentials({spreadsheetId:'somesheet',range:'Site Defaults!A1:J'});
```
