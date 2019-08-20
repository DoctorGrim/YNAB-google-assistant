const { dialogflow } = require("actions-on-google");
const functions = require("firebase-functions");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

const ynab = require("ynab");

const app = dialogflow({ debug: true }); //is this redundant with line 4?

const WELCOME = ["YNAB DEV"];

app.intent("Default Welcome Intent", conv => {
  let item = Math.floor(Math.random() * WELCOME.length);
  conv.ask(`${WELCOME[item]} What information can I get for you today?`);
});

//Given a nameKey (category), search an array of objects for an object with the name of nameKey and return that object.
function search(nameKey, myArray) {
  // The clean function clears any char issues relating to fetching category names from
  function clean(string) {
    string = string
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(
        /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      )
      .replace(" ", "")
      .trim();
    return string;
  }
  for (var i = 0; i < myArray.length; i++) {
    if (clean(myArray[i].name) == clean(nameKey)) {
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

  //For API token testing use: 0ac5d0e19930544fab97a568a6f4bda90bed5c02a8e1bd3c712c88814377aa4f
  //When OAuth is working replace the API token below with: conv.user.raw.accessToken
  const ynabAPI = new ynab.API(conv.user.raw.accessToken);

  return (
    ynabAPI.months
      //When using the API token use the budget ID: 7f7e5fce-4f83-44ac-87d0-179b16a180d3
      //When OAuth is working replace the budget ID below with 'default'
      .getBudgetMonth("default", "current")
      .then(r => {
        const ynabCategories = r.data.month.categories;
        //conv.data.balances will store all the budget information will in the conversation.
        conv.data.balances = ynabCategories.map(c => {
          return {
            name: c.name.toLowerCase(),
            balance: ynab.utils
              .convertMilliUnitsToCurrencyAmount(c.balance, 2)
              .toFixed(2)
            // budgeted: ynab.utils
            //   .convertMilliUnitsToCurrencyAmount(c.budgeted, 2)
            //   .toFixed(2)
          };
        });
        const categoryObj = search(categories, conv.data.balances);
        if (categoryObj.balance >= 0) {
          conv.ask(
            `The current balance of ${categoryObj.name} is $${
              categoryObj.balance
            }. Anything else? Just ask for it or say I'm done.`
          );
          // If a user has gone over their budget.
        } else if (categoryObj.balance < 0) {
          conv.ask(
            `The current balance of your ${
              categoryObj.name
            } category is overspent by $${-categoryObj.balance}. Can I do anything else for you? If not you can say I'm done.`
          );
          // In the case that no category is found, this will ask the user to try again.
        } else {
          conv.ask(
            `I'm sorry, I couldn't find a category called ${categories}. Do you want to check another balance?`
          );
        }
      })
      .catch(e => {
        conv.ask(`Error: ${e} `);
      })
  );
});

app.intent(
  "getting multiple inputs",
  async (conv, { amount, payee, category, account }) => {
    //Make a new instance of ynabAPI. Do I need an if(ynabAPI)?
    const ynabAPI = new ynab.API(conv.user.raw.accessToken);

    //Using a global variable at the moment to keep the try/catch isolated
    try {
      const allAccountData = await ynabAPI.accounts.getAccounts("default");
      var accountList = allAccountData.data.accounts.map(account => {
        return {
          name: account.name.toLowerCase(),
          id: account.id
        };
      });
      var allCategories = await ynabAPI.months.getBudgetMonth(
        "default",
        "current"
      );
      var categoryList = allCategories.data.month.categories.map(c => {
        return {
          name: c.name.toLowerCase(),
          id: c.id
        };
      });
      
    } catch (e) {
      conv.ask(`There was an error: ${e}`);
    }

    const accountObj = search(account, accountList);
    const categoryObj = search(category, categoryList);

    conv.ask(
      `You spent $${
        amount.amount
      } on ${category} at ${payee} from your ${account} account.`
    );
    conv.ask(`The category ID is: ${categoryObj.id}. The account ID is: ${accountObj.id}.`);
  }
);
/*
 * NOTE: Reprompts only work on smart speakers.
 * These are default. They are not intent-specific. For this we will need dynamic reprompts.
 * I used default since currently our only functionality is category balance fetching.
 */
app.intent("no input", conv => {
  const repromptCount = parseInt(conv.arguments.get("REPROMPT_COUNT"));
  if (repromptCount === 0) {
    conv.ask(`You can say something like how much do i have left in groceries`);
  } else if (repromptCount === 1) {
    conv.ask(
      `You can check a category balance by saying something like What\'s the balance of my electric category?`
    );
    // If the user doesn't say anything after the final reprompt, google will automatically end the dialog.
  } else if (conv.arguments.get("IS_FINAL_REPROMPT")) {
    conv.close(
      `Can I do anything else for you?  If not you can say I\'m done.`
    );
  }
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
