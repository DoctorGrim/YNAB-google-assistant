const { dialogflow, SignIn } = require("actions-on-google");
const functions = require("firebase-functions");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

const ynab = require("ynab");

const app = dialogflow({ debug: true }); //is this redundant with line 4?

app.intent("Default Welcome Intent", conv => {
  conv.ask(` What information can I get for you today?`);
});

//Given a nameKey (category), search an array of objects for an object with the name of nameKey and return that object.
function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (
      myArray[i].name.replace(/[^a-zA-Z0-9 ]/g, "") ==
      nameKey.replace(/[^a-zA-Z0-9 ]/g, "")
    ) {
      return myArray[i];
    }
  }
  return "No Match";
}
//This intent is triggered by giving a category. It fetches all the budget categories from the default budget for the current month.
//The returned categories are parsed down to the name, balance, and budgeted amount (we may not need this). We then use a search function
//to search for the category name passed in and return an object that has the same name. We then speak the category name and balance.
app.intent("get balance", (conv, { categories }) => {
  //We have to instantiate the new YNAB API after the OAuth token has been stored in conv.user.raw.accessToken.
  const ynabAPI = new ynab.API(conv.user.raw.accessToken);

  return ynabAPI.months
    .getBudgetMonth("default", "current")
    .then(r => {
      const ynabCategories = r.data.month.categories;
      //conv.data.balances will store all the budget information will in the conversation.
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
        // If the user has all of their budgeted available.
        conv.ask(
          `You have $${categoryObj.budgeted} of your ${
            categoryObj.name
          } budget remaining. Do you want to check another balance?`
        );
        // If a user has spent some, but is still in the green.
      } else if (categoryObj.balance >= 0) {
        conv.ask(
          `You have $${categoryObj.balance} avalable in your ${
            categoryObj.name
          } budget. Do you want to check another balance?`
        );
        // If a user has gone over their budget.
      } else if (categoryObj.balance < 0) {
        conv.ask(
          `You are over your ${
            categoryObj.name
          } budget by $${-categoryObj.balance}. Do you want to check another balance?`
        );
        // In the case that no category is found, this will ask the user to try again.
      } else {
        conv.ask(
          `I'm sorry, I couldn't find a category called ${categories}. Do you want to check another balance?`
        );
      }
    })
    .catch(e => {
      conv.ask(
        `There was an error fetching your information. Please try again later. Do you want to check another balance?`
      );
    });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
