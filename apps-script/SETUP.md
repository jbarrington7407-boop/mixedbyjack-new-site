# Connecting the forms (about 10 minutes)

Do this signed in to the Google account for your business email, since confirmation emails send from whichever account owns the script.

1. Go to sheets.new and name the sheet "MixedByJack Leads".
2. In the sheet: Extensions > Apps Script. Delete the starter code and paste in everything from `Code.gs`. Save.
3. Choose `authorize` in the function dropdown and click Run. Approve the permissions (Gmail and Sheets). If Google warns the app is unverified, click Advanced > Go to project. This is your own script.
4. Deploy > New deployment > type: Web app. Execute as: Me. Who has access: Anyone. Click Deploy and copy the Web app URL.
5. Paste that URL into `SHEETS_ENDPOINT` at the top of `main.js` (or send it to Claude).

# Updating the script later (keeps the same URL)

1. Open the leads sheet > Extensions > Apps Script. Select all, paste in the new `Code.gs`, and save.
2. Choose `setup` in the function dropdown and click Run. This adds any new columns to the right of your existing ones; your existing leads stay where they are.
3. Deploy > Manage deployments > click the pencil on your existing web app > Version: **New version** > Deploy.
   Don't use "New deployment" here: that creates a new URL and the site would keep posting to the old one.
