# YNAB-google-assistant
YNAB Google Assistant integration via API

#getting started

#make sure firebase CLI is installed

npm -g install firebase-tools

#To verify that the CLI has been installed correctly, open a terminal and run:

firebase --version

#Make sure the version of the Firebase CLI is above 3.5.0 so that it has all the latest features required for Cloud Functions. If not, run npm install -g firebase-tools to upgrade as shown above.

#Authorize the Firebase CLI by running:

firebase login

#Navagate to ./functions then run:

firebase use --project ynab-31eab

#Run the following command in the terminal to install dependencies.

npm install

#Run the following command in the terminal to deploy your webhook to Firebase.

firebase deploy --project ynab-31eab

#you must deploy to Firebase each time you make changes
