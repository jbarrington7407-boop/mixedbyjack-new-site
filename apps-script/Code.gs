/**
 * MixedByJack form handler (Google Apps Script)
 *
 * What it does on every website form submission:
 *   1. Adds a row to the "Intake" or "Contact" tab of this Google Sheet
 *   2. Sends the visitor a confirmation email from this Google account
 *   3. Emails you a short notification with the details
 *
 * Setup steps are in SETUP.md.
 */

var BUSINESS_NAME = 'Jack Barrington | MixedByJack';
var SITE_URL = 'https://www.mixedbyjack.net';
var INSTAGRAM = 'https://instagram.com/mixed.by.jack';

var HEADERS = {
  Intake: ['Timestamp', 'First name', 'Artist / band', 'Email', 'Project type', 'Project description', 'Additional notes', 'Music link'],
  Contact: ['Timestamp', 'Name', 'Email', 'Message']
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return ok_();                     // honeypot: bots fill this, humans never see it
  var type = p.form_type === 'contact' ? 'Contact' : 'Intake';
  var email = (p.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok_();

  var row, firstName;
  if (type === 'Intake') {
    firstName = (p.first_name || '').trim();
    row = [new Date(), firstName, p.artist_name || '', email, p.project_type || '',
           p.project_description || '', p.additional_notes || '', p.file_link || ''];
  } else {
    firstName = (p.name || '').trim().split(' ')[0];
    row = [new Date(), p.name || '', email, p.message || ''];
  }

  log_(type, row);
  try { confirm_(type, firstName, email); } catch (err) { console.error('confirm failed', err); }
  try { notify_(type, row); } catch (err) { console.error('notify failed', err); }
  return ok_();
}

function log_(type, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(type) || ss.insertSheet(type);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS[type]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS[type].length).setFontWeight('bold');
  }
  sh.appendRow(row);
}

function confirm_(type, firstName, email) {
  var hi = firstName ? 'Hey ' + firstName + ',' : 'Hey,';
  var subject, text;
  if (type === 'Intake') {
    subject = 'Got your project, thanks!';
    text = hi + '\n\n' +
      'Thanks for sending your project over. I got everything and will review it personally. ' +
      'You can expect a reply from me within 24 hours with next steps.\n\n' +
      'If you have demos, rough mixes, or stems, reply to this email with a Dropbox, Google Drive, or WeTransfer link and I\'ll take a listen.\n\n' +
      'Talk soon,\nJack Barrington\nMixedByJack\n' + SITE_URL;
  } else {
    subject = 'Got your message, thanks!';
    text = hi + '\n\n' +
      'Thanks for reaching out. I got your message and will get back to you within 24 hours.\n\n' +
      'Talk soon,\nJack Barrington\nMixedByJack\n' + SITE_URL;
  }
  GmailApp.sendEmail(email, subject, text, { name: BUSINESS_NAME, replyTo: Session.getEffectiveUser().getEmail() });
}

function notify_(type, row) {
  var me = Session.getEffectiveUser().getEmail();
  var labels = HEADERS[type];
  var lines = [];
  for (var i = 1; i < row.length; i++) lines.push(labels[i] + ': ' + row[i]);
  var replyTo = type === 'Intake' ? row[3] : row[2];
  GmailApp.sendEmail(me, 'New ' + type.toLowerCase() + ' form: ' + (row[1] || replyTo), lines.join('\n\n'),
    { name: 'MixedByJack site', replyTo: replyTo });
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to authorise Gmail + Sheets access. */
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet();
  GmailApp.getInboxUnreadCount();
}
