const fs = require('fs');
const {google} = require('googleapis');
const Promisify = require('bluebird');
const readlineSync = require('readline-sync');

class SimpleGoogleSheets {
    
    constructor(config={}) {
        this.config = config;        
        console.log(`Credentials: ${this.config.CREDENTIALS_PATH} \nToken: ${this.config.TOKEN_PATH}`);       
    }

    async getRowsWithCredentials({spreadsheetId, range}) {
        const clientSecret = JSON.parse(fs.readFileSync(this.config.CREDENTIALS_PATH));
        const auth = await this.authorize(clientSecret);
        var rows = await this.getDataFromSheet({auth,spreadsheetId,range});
        return rows;
    }    

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     */
    async authorize (credentials) {
        const clientSecret = credentials.installed.client_secret;
        const clientId = credentials.installed.client_id;
        const redirectUrl = credentials.installed.redirect_uris[0];
        //const auth = new googleAuth()
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
        const getToken = Promisify.promisify(oauth2Client.getToken, {context: oauth2Client});

        let token = {};

        // If modifying these scopes, delete token.json.
        // const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];        
        // The file token.json stores the user's access and refresh tokens, and is
        // created automatically when the authorization flow completes for the 1st time

        // Check if we have previously stored a token.
        try {
            token = JSON.parse(fs.readFileSync(this.config.TOKEN_PATH));
        } catch (err) {
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline', scope: this.config.SCOPES
            });

            console.log(`Authorize this app by visiting this url: ${authUrl}`);
            var code = readlineSync.question('Enter the code from that page here: ');
            try {
                token = await getToken(code);
                this.storeToken(token);
            } catch (err) {
                console.log('Error while trying to retrieve access token');
                throw err;
            }
        }

        oauth2Client.credentials = token;
        return oauth2Client;
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    storeToken (token) {        
        fs.writeFileSync(this.config.TOKEN_PATH, JSON.stringify(token));
        console.log(`Token stored to ${this.config.TOKEN_PATH}`);
    }

    /**
     * Retrieves the data from a sheet given a spreadsheetId and range
     * @param {} options containing `auth` {google.auth.OAuth2}, `spreadsheetId` {String} and `range` {String}
     */
    async getDataFromSheet( {auth,spreadsheetId,range} ) {
        const sheets = google.sheets({version: 'v4', auth:auth});
        const response = await sheets.spreadsheets.values.get({auth,spreadsheetId,range});        

        try{
            var rows = response.data.values;
            if (rows.length == 0) {
                console.info(`No headers and data found: ${JSON.stringify(options)}`);
                return;
            }                        

            var headers = rows[0]; // first row is always the header row            
            var data = rows.splice(1,rows.length); // everything after the first header row is data      
            console.info(`Rows:${data.length} for sheet:${spreadsheetId} with range:${range}`);

            var processed = data.reduce((map,row) => {        

                var processedRow = {};

                for(var h in headers) {
                    var header = this.camelize(headers[h]); // Email becomes email, Sales Force becomes salesForce, Purchase Date becomes purchaseDate etc
                    processedRow[header] = row[h];
                }

                map[row[0]] = processedRow; // key the data by the first column value
                
                return map;
            }, {});            

            return processed;            

        } catch (err) {
            console.error(`The API returned an error: ${err}`)
            return;
        }
    }

    // https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case/2970588
    camelize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }
}


module.exports = {
  SimpleGoogleSheets
};