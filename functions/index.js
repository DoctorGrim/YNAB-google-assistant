const { dialogflow, SignIn } = require("actions-on-google");
const functions = require("firebase-functions");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

//YNAB - Change to use OAuth
const ynab = require("ynab");

const app = dialogflow({ debug: true }); //is this redundant with line 4

app.intent("Default Welcome Intent", conv => {
  conv.ask(`What information can I get for you today?`);
  // Complete your fulfillment logic and
  // send a response when the function is done executing
});

//Given a nameKey (category), search an array of objects for an object with the name of nameKey and return that object.
function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].name == nameKey) {
      return myArray[i];
    }
  }
  return "No Match";
}
//This intent is triggered by giving a category. It fetches all the budget categories from the default budget for the current month.
//The returned categories are parsed down to the name, balance, and budgeted amount (we may not need this). We then use a search function
//to search for the category name passed in and return an object (or objects) that have the same name. We then speak the category name and balance.
app.intent("get balance", (conv, { categories }) => {
  //We have to instantiate the new YNAB API after the OAuth token has been stored in conv.user.raw.accessToken.
  const ynabAPI = new ynab.API(conv.user.raw.accessToken);

  //Leave the if/else commented out for now. This way we force a fetch each time. This let's us update our information between requests. Eventually
  //this should be a lamda request.

  // if (!conv.data.balances) {
  return ynabAPI.months.getBudgetMonth("default", "current").then(r => {
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
    if (
      categoryObj.balance === categoryObj.budgeted &&
      categoryObj.balance != undefined
    ) {
      conv.ask(
        `You have all $${categoryObj.budgeted} of your ${
          categoryObj.name
        } budget remaining.`
      );
    } else if (categoryObj.balance >= 0) {
      conv.ask(
        `You have $${categoryObj.balance} remaining of $${
          categoryObj.budgeted
        } budgeted for ${categoryObj.name}.`
      );
    } else if (categoryObj.balance < 0) {
      conv.ask(
        `You are over your ${
          categoryObj.name
        } budget by $${-categoryObj.balance}`
      );
    } else {
      conv.ask(
        `I'm sorry, I couldn't find a matching budget. Please try again.`
      );
    }
  });
  // } else {
  //   //Find in the logs if a second request uses the stored budget or fetches new data.
  //   //If we're adding new transactions this will have to be removed or we'll need to use delta requests.
  //   const categoryObj = search(categories, conv.data.balances);
  //   conv.ask(
  //     `You have $${categoryObj.balance} remaining in your ${
  //       categoryObj.name
  //     } budget`
  //   );
  // }
});

// if we want to move sign in from the start of the Action we will have to use somthing like this.
// Intent that starts the account linking flow.
// app.intent('Start Signin', (conv) => {
//     conv.ask(new SignIn('To get your account details'));
//   });

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
