const {dialogflow, SignIn} = require('actions-on-google');
const functions = require('firebase-functions');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements


const app = dialogflow({
    // gotten from YNAB OAuth Application
    //clientId: '2922732bc9578566f020a9af459bca17a1d261ec8ebff0e0d4c2d3300c2888a6',
  });

app.intent('Default Welcome Intent', (conv) => {
  conv.close(`${user}`);
  // Complete your fulfillment logic and
  // send a response when the function is done executing
});


// if we want to move sign in from the start of the Action we will have to use somthing like this.
// Intent that starts the account linking flow.
// app.intent('Start Signin', (conv) => {
//     conv.ask(new SignIn('To get your account details'));
//   });
    

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


