// Hooray! Here comes YNAB!
import * as ynab from "ynab";

// Import our config for YNAB
import config from "./config.json";

export default {
  // The data to feed our templates
  data() {
    return {
      ynab: {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        token: null,
        api: null
      },
      loading: false,
      error: null,
      budgetId: null,
      budgets: [],
      transactions: []
    };
  },
  // When this component is created, check whether we need to get a token,
  // budgets or display the transactions
  created() {
    this.ynab.token = this.findYNABToken();
    if (this.ynab.token) {
      this.api = new ynab.api(this.ynab.token);
      if (!this.budgetId) {
        this.getBudgets();
      } else {
        this.selectBudget(this.budgetId);
      }
    }
  },
  methods: {
    // This uses the YNAB API to get a list of budgets
    getBudgets() {
      this.loading = true;
      this.error = null;
      this.api.budgets
        .getBudgets()
        .then(res => {
          this.budgets = res.data.budgets;
        })
        .catch(err => {
          this.error = err.error.detail;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // This selects a budget and gets all the transactions in that budget
    selectBudget(id) {
      this.loading = true;
      this.error = null;
      this.budgetId = id;
      this.transactions = [];
      this.api.transactions
        .getTransactions(id)
        .then(res => {
          this.transactions = res.data.transactions;
        })
        .catch(err => {
          this.error = err.error.detail;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // This builds a URI to get an access token from YNAB
    // https://api.youneedabudget.com/#outh-applications
    authorizeWithYNAB(e) {
      e.preventDefault();
      const uri = `https://app.youneedabudget.com/oauth/authorize?client_id=${
        this.ynab.clientId
      }&redirect_uri=${this.ynab.redirectUri}&response_type=token`;
      location.replace(uri);
    },
    // Method to find a YNAB token
    // First it looks in the location.hash and then sessionStorage
    findYNABToken() {
      let token = null;
      const search = window.location.hash
        .substring(1)
        .replace(/&/g, '","')
        .replace(/=/g, '":"');
      if (search && search !== "") {
        // Try to get access_token from the hash returned by OAuth
        const params = JSON.parse('{"' + search + '"}', function(key, value) {
          return key === "" ? value : decodeURIComponent(value);
        });
        token = params.access_token;
        sessionStorage.setItem("ynab_access_token", token);
        window.location.hash = "";
      } else {
        // Otherwise try sessionStorage
        token = sessionStorage.getItem("ynab_access_token");
      }
      return token;
    },
    // Clear the token and start authorization over
    resetToken() {
      sessionStorage.removeItem("ynab_access_token");
      this.ynab.token = null;
      this.error = null;
    }
  }
};
