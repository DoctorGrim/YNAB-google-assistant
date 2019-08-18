# YNAB Google Assistant Integration

We partnered with Youneedabudget.com or YNAB to allow someone using Google Assistant to fetch the amounts in their categories, and what they have available to spend, or the amount they have exceeded their budget by.

## Installing / Getting started

We are not currently publicly available but will have an alpha release soon. In order to use this project, a YNABB account is required.

## Developing

Here's a brief intro about what a developer must do in order to start developing
the project further:

```shell
git clone https://github.com/DoctorGrim/YNAB-google-assistant.git
cd YNAB-google-assistant
npm -g install firebase-tools
cd ./functions
npm install
firebase login
firebase use --project ynab-31eab
firebase deploy --project ynab-31eab
```
Clone our repository and navigate to the project folder.

Make sure the version of the Firebase CLI(Command Line Interface) is above 3.5.0 so that it has all the latest features required for Cloud Functions. If not, run npm install -g firebase-tools to upgrade as shown above.  Navigate to the functions folder and install our dependencies, then authorize firebase by logging in. Set firebase to use our project. If you make any changes, to the project, in order to see them implemented, you must deploy firebase.

## Features

What's all the bells and whistles this project can perform?
* The ability to use Google Assistant to access category amounts.
* Currently building out the ability to add a transaction via Google Assistant.

## Contributing

When you publish something open source, one of the greatest motivations is that
anyone can just jump in and start contributing to your project.

These paragraphs are meant to welcome those kind souls to feel that they are
needed. You should state something like:

"If you'd like to contribute, please fork the repository and use a feature
branch. Pull requests are warmly welcome. This project uses the Google Actions console and DiaglogFlow. You will need to login to these tools via your email account in order to contribute to the project.

## Links

- Repository: https://github.com/DoctorGrim/YNAB-google-assistant
- Issue tracker: https://github.com/DoctorGrim/YNAB-google-assistant/issues

This project adheres to YNAB's privacy policy  and terms of Service which can be found below.
- YNAB Privacy Policy: https://www.youneedabudget.com/privacy-policy/
- YNAB Terms of Service: https://www.youneedabudget.com/terms/

## Licensing

The code in this project is licensed under MIT license.
