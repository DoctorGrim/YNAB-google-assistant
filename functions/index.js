const {dialogflow, SignIn} = require('actions-on-google');
const functions = require('firebase-functions');


process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

//YNAB - Change to use OAuth
const ynab = require("ynab");
const accessToken =
  "0ac5d0e19930544fab97a568a6f4bda90bed5c02a8e1bd3c712c88814377aa4f";
const ynabAPI = new ynab.API(accessToken);

const app = dialogflow({
    // gotten from YNAB OAuth Application
    //clientId: '2922732bc9578566f020a9af459bca17a1d261ec8ebff0e0d4c2d3300c2888a6',
  });

app.intent('Default Welcome Intent', (conv) => {
  conv.ask(`What would you like me to do?`);
  // Complete your fulfillment logic and
  // send a response when the function is done executing
});

function search(nameKey, myArray){
  for (var i=0; i < myArray.length; i++) {
      if (myArray[i].name == nameKey) {
          return myArray[i];
      }
  }
}

app.intent('get balance', (conv, { categories }) => {
  //Currently does not use OAuth
  //Replace the first parameter with the budgetId - will need to fetch it or use "default" is using OAuth
 
  return ynabAPI.months.getBudgetMonth("7f7e5fce-4f83-44ac-87d0-179b16a180d3", "current")
    .then(r => {
      const ynabCategories = r.data.month.categories;
      conv.data.balances = ynabCategories.map(c => {
        return {
          name: c.name.toLowerCase(),
          balance: ynab.utils
            .convertMilliUnitsToCurrencyAmount(c.balance, 2)
            .toFixed(2),
          budgeted: ynab.utils
            .convertMilliUnitsToCurrencyAmount(c.budgeted, 2)
            .toFixed(2)
        };
      });
      const categoryObj = search(categories, conv.data.balances); 
      conv.close(`You have ${categoryObj.balance} remaining in your ${categoryObj.name} budget`);
    });
});

// if we want to move sign in from the start of the Action we will have to use somthing like this.
// Intent that starts the account linking flow.
// app.intent('Start Signin', (conv) => {
//     conv.ask(new SignIn('To get your account details'));
//   });
    

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


