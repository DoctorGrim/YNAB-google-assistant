const {dialogflow, SignIn} = require('actions-on-google');
const functions = require('firebase-functions');


process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

//YNAB - Change to use OAuth
const ynab = require("ynab");
// const accessToken =
//   "0ac5d0e19930544fab97a568a6f4bda90bed5c02a8e1bd3c712c88814377aa4f";


const app = dialogflow({
  // gotten from YNAB OAuth Application
  //clientId: '2922732bc9578566f020a9af459bca17a1d261ec8ebff0e0d4c2d3300c2888a6',
});

app.intent('Default Welcome Intent', (conv) => {
  conv.ask(`What would you like me to do?`);
  // Complete your fulfillment logic and
  // send a response when the function is done executing
});

//Given a nameKey (category), search an array of objects for an object with the name of nameKey and return that object. 
function search(nameKey, myArray){
  for (var i=0; i < myArray.length; i++) {
    if (myArray[i].name == nameKey) {
      return myArray[i];
    }
  }
}
//This intent is triggered by giving a category. It fetches all the budget categories from the default budget for the current month.
//The returned categories are parsed down to the name, balance, and budgeted amount (we may not need this). We then use a search function
//to search for the category name passed in and return an object (or objects) that have the same name. We then speak the category name and balance. 
app.intent('get balance', (conv, { categories }) => {
  
  //We have to instantiate the new YNAB API after the OAuth token has been stored in conv.user.raw.accessToken. 
  const ynabAPI = new ynab.API(conv.user.raw.accessToken);

  if(!conv.data.balances) {
  return ynabAPI.months.getBudgetMonth("default", "current")
  .then(r => {
    const ynabCategories = r.data.month.categories;
    //conv.data.balances will store all the budget information will in the conversation. Use this to check if the data has already been fetched.
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
      conv.ask(`You have $${categoryObj.balance} remaining in your ${categoryObj.name} budget`);
    });
  } else {
    //Find in the logs if a second request uses the stored budget or fetches new data
    const categoryObj = search(categories, conv.data.balances); 
    conv.ask(`You have $${categoryObj.balance} remaining in your ${categoryObj.name} budget`);
  }
});

// if we want to move sign in from the start of the Action we will have to use somthing like this.
// Intent that starts the account linking flow.
// app.intent('Start Signin', (conv) => {
//     conv.ask(new SignIn('To get your account details'));
//   });
    

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


