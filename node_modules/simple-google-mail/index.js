const fs = require('fs');
const {google} = require('googleapis');
const Promisify = require('bluebird');
const readlineSync = require('readline-sync');

class SimpleGoogleMail {
    
    constructor(config={}) {
        this.config = config;        
        console.log(`Credentials: ${this.config.CREDENTIALS_PATH} \nToken: ${this.config.TOKEN_PATH}`);       
        console.log(`Mail Output Path: ${this.config.MAIL_OUTPUT_PATH}`);
    }

    async processRecentEmailWithCredentials() {
        const clientSecret = JSON.parse(fs.readFileSync(this.config.CREDENTIALS_PATH));
        const auth = await this.authorize(clientSecret);
        var mail = await this.processRecentEmail(auth);
        return mail;
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

    async processRecentEmail(auth) {
        var messageObjects = await this.getRecentEmail(auth);
        await this.writeEmailsToFile(messageObjects);
        await this.deleteEmailsFromGmail(auth, messageObjects);  
        return messageObjects;
    }
      
    async deleteEmailsFromGmail(auth, messageObjects=[]) {
        var message_ids = [];
        for(let m in messageObjects) {
            message_ids.push(messageObjects[m].id);
        }  
        
        return new Promise( resolve => {

            if( message_ids.length == 0 ) {
                return resolve(); // Nothing to delete
            }

            console.log('Deleting emails: ', message_ids);
            const gmail = google.gmail({version: 'v1', auth});
            gmail.users.messages.batchDelete({auth:auth, userId:'me', "resource": {"ids":message_ids}}, (err,result) => {
                if(err) console.log(err);
                //if(result) console.log(result);            
                return resolve();
            });    
        });
    }
    
    /**
     * Get the recent email from your Gmail account
     *
     * @param {Array} messageObjects
     */
    async writeEmailsToFile( messageObjects = [] ) {
        for( let m in messageObjects ) {
            var messageObject = messageObjects[m];
            console.log(messageObject.subject);
            await this.writeMessageObjectToFile( messageObject );
        }
    }
    
    async writeMessageObjectToFile( messageObject = {} ) {        

        if( !fs.existsSync(this.config.MAIL_OUTPUT_PATH) ) {
            fs.mkdirSync(this.config.MAIL_OUTPUT_PATH);
        }

        // var emailFileLocation = this.config.MAIL_OUTPUT_PATH + '/' + messageObject.subject + '.html';
        // await fs.writeFileSync(emailFileLocation, messageObject.message);
        // console.log('Successfully wrote: ' + emailFileLocation);
        // return Promise.resolve();
        return new Promise( resolve => {
            fs.mkdir(this.config.MAIL_OUTPUT_PATH, () => {
                var emailFileLocation = this.config.MAIL_OUTPUT_PATH + '/' + messageObject.subject + '.html';
                var _resolve = resolve;

                fs.writeFile(emailFileLocation, messageObject.message, (errorWritingFile) => {
                    if (errorWritingFile) {
                        console.error(errorWritingFile);
                        console.error('Failure to write: ' + emailFileLocation);
                        return _resolve();
                    }
                    //file written successfully
                    console.log('Successfully wrote: ' + emailFileLocation);
                    return _resolve();
                });
            });
        });
    }
    
    /**
     * Get the recent email from your Gmail account
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    async getRecentEmail(auth) {
    
        // Only get the recent email - 'maxResults' parameter
        const gmail = google.gmail({version: 'v1', auth});
        const _this = this;
    
        return new Promise( resolve => {
    
            gmail.users.messages.list({auth: auth, userId: 'me', maxResults: 10}, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return resolve([]);
                }
        
                if( response.data.resultSizeEstimate == 0 ) {
                    console.log('New Badge Unlocked: Inbox Zero.');
                    return resolve([]);
                }      
        
                return resolve(_this.getMessageObjects(gmail, auth, response.data.messages));      
            });
        
        });
    }
    
    async getMessageObjects( gmail, auth, message_ids ) {
            
        var messages = [];
    
        for( let i=0; i < message_ids.length; ++i ) {
            var message_id = message_ids[i].id;
            var message = await this.getMessageObject(gmail, auth, message_id);      
            messages.push(message);
        }
    
        return Promise.resolve(messages);
    }
    
    async getMessageObject( gmail, auth, message_id ) {
    
        const _this = this;

        var promise = new Promise(resolve => {
            gmail.users.messages.get({auth: auth, userId: 'me', id: message_id, format:'full'}, function(err, response) {
            
            if (err) {
                console.error( message_id + ': The API returned an error: ' + err);                
                resolve({id:message_id, message:'Error', subject:'Error', snippet:'Error'});
                return;
            }
        
            // Sometimes it's nice to debug
            //console.debug(response.data.payload.);
            var subject = _this.getSubjectFromResponse(response);
            var text = _this.getMessageFromResponse(response);     
            resolve({id:message_id, message:text, snippet:text.substr(0,80), subject:subject});      
            });
        
        });
        
        return promise;
    }
    
    getMessageFromResponse(response) {
        let message_raw; 

        // Access the email body content. Sometimes we have raw text emails, and other times we have html embedded.
        if( response.data.payload.parts && response.data.payload.parts[1] && response.data.payload.parts[1].body ) {
            message_raw = response.data.payload.parts[1].body.data; // html embedded 
        } else if( response.data.payload.parts && response.data.payload.parts[0] && response.data.payload.parts[0].body ) {
            message_raw = response.data.payload.parts[0].body.data; // html embedded 
        } else {
            message_raw = response.data.payload.body.data; // raw text
        }
        
        var data = message_raw;  
        var buff = new Buffer.from(data, 'base64');  
        return buff.toString();
    }
        
    getHeadersFromResponse(response) {
        return response.data.payload.headers
    }
    
    getSubjectFromResponse(response) {
        return this.getValueForKeyFromHeaders(this.getHeadersFromResponse(response),'Subject');
    }
    
    getValueForKeyFromHeaders(headers, key) {
        for( let h = 0; h < headers.length; h++ ) {
            if( headers[h].name === key ) {
                return headers[h].value;
            }    
        }
        return 'No Subject';
    }
}

module.exports = {
  SimpleGoogleMail
};