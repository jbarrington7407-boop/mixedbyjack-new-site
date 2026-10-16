/**
 * MixedByJack leads sheet + form handler (Google Apps Script)
 *
 * This script lives inside the leads Google Sheet (Extensions > Apps Script).
 *
 *   setup()           builds and formats the sheet. Run once; safe to re-run.
 *   testSubmission()  adds one fake lead and emails only you, to check everything works.
 *   doPost()          runs on every website form submission:
 *                       1. adds the lead to "All Leads" and to its own tab
 *                       2. emails the visitor a confirmation from this account
 *                       3. emails you a notification
 */

var BUSINESS_NAME = 'Jack Barrington | MixedByJack';
var SITE_URL = 'https://www.mixedbyjack.net';
var STATUSES = ['New', 'Replied', 'Booked', 'Not a fit'];

var FORMS = {
  intake:  { label: 'Mix / Master Inquiry', tab: 'Mix & Master Inquiries', color: '#ede4ff' },
  contact: { label: 'General Message',      tab: 'General Messages',       color: '#e3f0fb' }
};

// Every tab: [header, column width]
var TABS = {
  'All Leads': [
    ['Received', 150], ['Form', 160], ['Name', 140], ['Artist / band', 150], ['Email', 210],
    ['Project type', 110], ['Details', 380], ['Status', 110], ['My notes', 260]
  ],
  'Mix & Master Inquiries': [
    ['Received', 150], ['First name', 120], ['Artist / band', 150], ['Email', 210], ['Project type', 110],
    ['Project description', 340], ['Additional notes', 280], ['Music link', 240], ['Status', 110], ['My notes', 260]
  ],
  'General Messages': [
    ['Received', 150], ['Name', 150], ['Email', 210], ['Message', 420], ['Status', 110], ['My notes', 260]
  ]
};

/* ---------------- Website submissions ---------------- */

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return ok_();                                  // honeypot: only bots fill this
  var kind = p.form_type === 'contact' ? 'contact' : 'intake';
  var email = clean_(p.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok_();

  var lead = kind === 'intake'
    ? { kind: kind, name: clean_(p.first_name), artist: clean_(p.artist_name), email: email,
        projectType: clean_(p.project_type), description: clean_(p.project_description),
        notes: clean_(p.additional_notes), link: clean_(p.file_link) }
    : { kind: kind, name: clean_(p.name), email: email, message: clean_(p.message) };

  record_(lead);
  try { confirm_(lead); } catch (err) { console.error('Confirmation email failed', err); }
  try { notify_(lead); }  catch (err) { console.error('Notification email failed', err); }
  return ok_();
}

function record_(lead) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    setup();                                                    // makes sure every tab exists
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();
    var form = FORMS[lead.kind];

    var details = lead.kind === 'intake'
      ? [lead.description, lead.notes, lead.link ? 'Music: ' + lead.link : ''].filter(String).join('\n\n')
      : lead.message;

    addRow_(ss.getSheetByName('All Leads'),
      [now, form.label, lead.name, lead.artist || '', lead.email, lead.projectType || '', details, 'New', '']);

    if (lead.kind === 'intake') {
      addRow_(ss.getSheetByName(form.tab),
        [now, lead.name, lead.artist, lead.email, lead.projectType, lead.description, lead.notes, lead.link, 'New', '']);
    } else {
      addRow_(ss.getSheetByName(form.tab), [now, lead.name, lead.email, lead.message, 'New', '']);
    }
  } finally {
    lock.releaseLock();
  }
}

// Newest lead goes at the top, right under the header.
function addRow_(sh, values) {
  sh.insertRowAfter(1);
  var r = sh.getRange(2, 1, 1, values.length);
  r.setValues([values]).setFontWeight('normal').setBackground(null).setFontColor('#1f1a2b');
}

/* ---------------- Emails ---------------- */

function confirm_(lead) {
  var hi = lead.name ? 'Hey ' + lead.name.split(' ')[0] + ',' : 'Hey,';
  var subject, text;
  if (lead.kind === 'intake') {
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
  GmailApp.sendEmail(lead.email, subject, text,
    { name: BUSINESS_NAME, replyTo: Session.getEffectiveUser().getEmail() });
}

function notify_(lead) {
  var me = Session.getEffectiveUser().getEmail();
  var form = FORMS[lead.kind];
  var lines = lead.kind === 'intake'
    ? ['Name: ' + lead.name, 'Artist / band: ' + lead.artist, 'Email: ' + lead.email,
       'Project type: ' + lead.projectType, 'Project description: ' + (lead.description || '-'),
       'Additional notes: ' + (lead.notes || '-'), 'Music link: ' + (lead.link || '-')]
    : ['Name: ' + lead.name, 'Email: ' + lead.email, 'Message: ' + lead.message];
  lines.push('', 'All leads: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  GmailApp.sendEmail(me, 'New ' + form.label + ': ' + (lead.artist || lead.name || lead.email),
    lines.join('\n'), { name: 'MixedByJack site', replyTo: lead.email });
}

/* ---------------- Sheet setup ---------------- */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = Object.keys(TABS);

  names.forEach(function (name, i) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name, i);
    var cols = TABS[name];
    if (sh.getRange(1, 1).getValue() === cols[0][0]) return;    // already built

    var header = sh.getRange(1, 1, 1, cols.length);
    header.setValues([cols.map(function (c) { return c[0]; })])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#5b3cc4')
      .setVerticalAlignment('middle');
    sh.setRowHeight(1, 34);
    sh.setFrozenRows(1);
    cols.forEach(function (c, j) { sh.setColumnWidth(j + 1, c[1]); });

    var body = sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length);
    body.setVerticalAlignment('top').setWrap(true);
    sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('mmm d, yyyy  h:mm am/pm');

    var headers = cols.map(function (c) { return c[0]; });
    var statusCol = headers.indexOf('Status') + 1;
    var statusRange = sh.getRange(2, statusCol, sh.getMaxRows() - 1, 1);
    statusRange.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUSES, true).setAllowInvalid(false).build());

    var rules = [
      statusRule_(statusRange, 'New', '#fff4cc'),
      statusRule_(statusRange, 'Replied', '#dbeafe'),
      statusRule_(statusRange, 'Booked', '#d1fae5'),
      statusRule_(statusRange, 'Not a fit', '#eeeeee')
    ];
    var formCol = headers.indexOf('Form') + 1;
    if (formCol) {
      var formRange = sh.getRange(2, formCol, sh.getMaxRows() - 1, 1);
      Object.keys(FORMS).forEach(function (k) {
        rules.push(statusRule_(formRange, FORMS[k].label, FORMS[k].color));
      });
    }
    sh.setConditionalFormatRules(rules);
  });

  // Remove the blank starter tab if it's still empty.
  var starter = ss.getSheetByName('Sheet1');
  if (starter && starter.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(starter);
  ss.setActiveSheet(ss.getSheetByName('All Leads'));
}

function statusRule_(range, value, color) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(value).setBackground(color).setRanges([range]).build();
}

/* ---------------- Helpers ---------------- */

/** Adds one fake intake lead. The "confirmation" goes to your own inbox. */
function testSubmission() {
  var me = Session.getEffectiveUser().getEmail();
  doPost({ parameter: {
    form_type: 'intake', first_name: 'Test', artist_name: 'Test Band', email: me,
    project_type: 'Single', project_description: 'Test submission from the script editor. Delete this row.',
    additional_notes: '', file_link: ''
  }});
}

function clean_(v) { return String(v || '').trim().slice(0, 5000); }

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
