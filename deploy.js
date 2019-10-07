const fs = require('fs');
const webStore = require('chrome-webstore-upload');
const chalk = require('chalk');


const REFRESH_TOKEN = process.env.REFRESH_TOKEN,
      EXTENSION_ID = process.env.EXTENSION_ID,
      CLIENT_SECRET = process.env.CLIENT_SECRET,
      CLIENT_ID = process.env.CLIENT_ID;

try {
    fs.statSync('./extension.zip');

    let extensionZip = fs.createReadStream('./extension.zip');
    
    let store = webStore({
        extensionId: EXTENSION_ID,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN
    });
    
    store.fetchToken().then(token => {
        store.uploadExisting(extensionZip, token)
             .then(res => {
                 if (res.uploadState === 'SUCCESS') {
                     console.log(chalk.bold.green('Upload was successful.'));
                     console.log(chalk.yellow('Start publishing.'));
                     store.publish('default', token)
                          .then(res => {
                              console.log(chalk.bold.green('Published.'));
                              console.log(res);
                          });
                 }
                 console.log(res);
             });
    }).catch(err => {console.error(err)});
    
} catch(err) {
    console.log(chalk.bold.red(err.message));
}
