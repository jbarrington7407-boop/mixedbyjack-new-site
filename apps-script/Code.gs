/**
 * MixedByJack leads sheet + form handler + follow-ups (Google Apps Script)
 *
 * This script lives inside the leads Google Sheet (Extensions > Apps Script).
 *
 *   setup()             builds / updates the sheet. Safe to re-run.
 *   installFollowUps()  run ONCE to switch on the daily follow-up check.
 *   testSubmission()    adds one fake lead and emails only you.
 *   doPost()            runs on every website form submission.
 *   dailyCheck()        runs every morning (after installFollowUps):
 *                         - marks leads "Replied" when you've answered them in Gmail
 *                         - emails you a list of leads still "New" after 24 hours
 *                         - sends ONE friendly check-in to leads you replied to
 *                           5+ days ago that haven't booked (unless they already wrote back)
 *   onEdit()            keeps Status in sync between tabs and stamps "Replied on".
 */

var BUSINESS_NAME = 'Jack Barrington | MixedByJack';
var SITE_URL = 'https://www.mixedbyjack.net';
var STATUSES = ['New', 'Replied', 'Booked', 'Not a fit'];

var REMIND_AFTER_HOURS = 24;     // nudge YOU about leads still "New"
var FOLLOW_UP_AFTER_DAYS = 5;    // check in with leads still "Replied"
var DAILY_CHECK_HOUR = 9;        // runs between 9 and 10am (script time zone)

var FORMS = {
  intake:  { label: 'Mix / Master Inquiry', tab: 'Mix & Master Inquiries', color: '#ede4ff' },
  contact: { label: 'General Message',      tab: 'General Messages',       color: '#e3f0fb' }
};

// Where the lead came from (added to the end of every tab)
var SOURCE_COLS = [['How they found you', 170], ['Traffic source', 160], ['Campaign / keyword', 200], ['Landing page', 160]];

// Every tab: [header, column width]
var TABS = {
  'All Leads': [
    ['Received', 150], ['Form', 160], ['Name', 140], ['Artist / band', 150], ['Email', 210],
    ['Project type', 110], ['Details', 380], ['Status', 110], ['My notes', 260],
    ['Replied on', 150], ['Reminder sent', 150], ['Follow-up sent', 170]
  ].concat(SOURCE_COLS),
  'Mix & Master Inquiries': [
    ['Received', 150], ['First name', 120], ['Artist / band', 150], ['Email', 210], ['Project type', 110],
    ['Project description', 340], ['Additional notes', 280], ['Music link', 240], ['Status', 110], ['My notes', 260]
  ].concat(SOURCE_COLS),
  'General Messages': [
    ['Received', 150], ['Name', 150], ['Email', 210], ['Message', 420], ['Status', 110], ['My notes', 260]
  ].concat(SOURCE_COLS)
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
  lead.source = [clean_(p.heard_about), clean_(p.lead_source) || 'Direct / unknown',
                 clean_(p.lead_campaign), clean_(p.landing_page)];

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
      [now, form.label, lead.name, lead.artist || '', lead.email, lead.projectType || '', details, 'New', '', '', '', ''].concat(lead.source));

    if (lead.kind === 'intake') {
      addRow_(ss.getSheetByName(form.tab),
        [now, lead.name, lead.artist, lead.email, lead.projectType, lead.description, lead.notes, lead.link, 'New', ''].concat(lead.source));
    } else {
      addRow_(ss.getSheetByName(form.tab), [now, lead.name, lead.email, lead.message, 'New', ''].concat(lead.source));
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

/* ---------------- Emails on submission ---------------- */

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
  var src = lead.source || [];
  lines.push('', 'Found you via: ' + (src[0] || 'didn\'t say') + '  (site saw: ' + (src[1] || 'Direct / unknown') +
             (src[2] ? ', ' + src[2] : '') + ')');
  lines.push('', 'All leads: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  GmailApp.sendEmail(me, 'New ' + form.label + ': ' + (lead.artist || lead.name || lead.email),
    lines.join('\n'), { name: 'MixedByJack site', replyTo: lead.email });
}

/* ---------------- Daily follow-up check ---------------- */

function dailyCheck() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('All Leads');
    if (!sh || sh.getLastRow() < 2) return;
    var c = cols_(sh);
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    var now = new Date();
    var me = Session.getEffectiveUser().getEmail().toLowerCase();
    var waiting = [], followedUp = [], wroteBack = [];

    data.forEach(function (row, i) {
      var r = i + 2;
      var email = String(row[c['Email']] || '').trim();
      var received = row[c['Received']];
      var status = row[c['Status']];
      if (!email || !(received instanceof Date)) return;

      var last = lastMessage_(email, received, me);

      // 1. You answered in Gmail but left it on "New" -> mark Replied for you.
      if (status === 'New' && last.lastFromMeAt) {
        setStatus_(ss, sh, r, received, email, 'Replied', last.lastFromMeAt);
        status = 'Replied';
        row[c['Replied on']] = last.lastFromMeAt;
      }

      // 2. Still "New" after 24h -> remind you (once).
      if (status === 'New' && hoursSince_(received, now) >= REMIND_AFTER_HOURS && !row[c['Reminder sent']]) {
        waiting.push(row);
        sh.getRange(r, c['Reminder sent'] + 1).setValue(now);
      }

      // 3. "Replied" 5+ days ago, not booked, no follow-up yet -> one check-in.
      var repliedOn = row[c['Replied on']];
      if (status === 'Replied' && repliedOn instanceof Date && !row[c['Follow-up sent']] &&
          hoursSince_(repliedOn, now) >= FOLLOW_UP_AFTER_DAYS * 24) {
        if (last.lastFrom === 'them') {
          sh.getRange(r, c['Follow-up sent'] + 1).setValue('Skipped: they wrote back');
          wroteBack.push(row);
        } else {
          sendFollowUp_(row, c, last.thread);
          sh.getRange(r, c['Follow-up sent'] + 1).setValue(now);
          followedUp.push(row);
        }
      }
    });

    if (waiting.length || followedUp.length || wroteBack.length) digest_(ss, c, waiting, followedUp, wroteBack);
  } finally {
    lock.releaseLock();
  }
}

// Most recent Gmail message to/from this lead since they submitted the form.
function lastMessage_(email, since, me) {
  var out = { lastFrom: null, lastFromMeAt: null, thread: null };
  var after = Utilities.formatDate(new Date(since.getTime() - 86400000), 'UTC', 'yyyy/MM/dd');
  var threads = GmailApp.search('(from:' + email + ' OR to:' + email + ') after:' + after, 0, 20);
  var latest = null;
  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      if (m.getDate() < since) return;
      var subj = m.getSubject() || '';
      var fromMe = m.getFrom().toLowerCase().indexOf(me) !== -1;
      // ignore the automatic confirmation email
      if (fromMe && /^Got your (project|message), thanks!$/.test(subj)) return;
      if (fromMe && (!out.lastFromMeAt || m.getDate() > out.lastFromMeAt)) out.lastFromMeAt = m.getDate();
      if (!latest || m.getDate() > latest.date) latest = { date: m.getDate(), fromMe: fromMe, thread: t };
    });
  });
  if (latest) { out.lastFrom = latest.fromMe ? 'me' : 'them'; out.thread = latest.thread; }
  return out;
}

function sendFollowUp_(row, c, thread) {
  var email = row[c['Email']];
  var first = String(row[c['Name']] || '').split(' ')[0];
  var hi = first ? 'Hey ' + first + ',' : 'Hey,';
  var isIntake = row[c['Form']] === FORMS.intake.label;
  var what = isIntake && row[c['Project type']] ? 'your ' + String(row[c['Project type']]).toLowerCase() : 'your project';
  var body = isIntake
    ? hi + '\n\nJust checking in on ' + what + '. Any questions about what I sent over? ' +
      'If now isn\'t the right time, no worries at all. Whenever you\'re ready, just reply here and we\'ll get it going.\n\n' +
      'Jack'
    : hi + '\n\nJust following up on my last message. Let me know if there\'s anything else I can help with.\n\nJack';
  var subject = thread ? 'Re: ' + thread.getFirstMessageSubject().replace(/^(Re:\s*)+/i, '') : 'Checking in';
  GmailApp.sendEmail(email, subject, body + '\n\n--\nJack Barrington\nMixedByJack\n' + SITE_URL,
    { name: BUSINESS_NAME, replyTo: Session.getEffectiveUser().getEmail() });
}

function digest_(ss, c, waiting, followedUp, wroteBack) {
  var line = function (row) {
    return '- ' + (row[c['Name']] || '(no name)') + (row[c['Artist / band']] ? ' / ' + row[c['Artist / band']] : '') +
      ' <' + row[c['Email']] + '>  (' + row[c['Form']] + ', ' +
      Utilities.formatDate(row[c['Received']], Session.getScriptTimeZone(), 'MMM d') + ')';
  };
  var parts = [];
  if (waiting.length) parts.push('Still waiting on a reply from you:\n' + waiting.map(line).join('\n'));
  if (followedUp.length) parts.push('Sent a check-in (no reply in ' + FOLLOW_UP_AFTER_DAYS + ' days):\n' + followedUp.map(line).join('\n'));
  if (wroteBack.length) parts.push('They wrote back, you may owe them a reply:\n' + wroteBack.map(line).join('\n'));
  parts.push('Update the Status column in All Leads: ' + ss.getUrl());
  var n = waiting.length + wroteBack.length;
  var subject = n ? n + ' lead' + (n > 1 ? 's' : '') + ' waiting on you' : 'Follow-ups sent';
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, parts.join('\n\n'), { name: 'MixedByJack leads' });
}

/* ---------------- Keep Status in sync ---------------- */

// Simple trigger: runs whenever you edit the sheet.
function onEdit(e) {
  if (!e || !e.range || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  var sh = e.range.getSheet();
  if (!TABS[sh.getName()] || e.range.getRow() < 2) return;
  var c = cols_(sh);
  if (e.range.getColumn() !== c['Status'] + 1) return;
  var row = sh.getRange(e.range.getRow(), 1, 1, sh.getLastColumn()).getValues()[0];
  var emailCol = c['Email'];
  setStatus_(e.source, sh, e.range.getRow(), row[c['Received']], row[emailCol], e.value, new Date());
}

// Sets Status on every tab for this lead; stamps "Replied on" the first time it becomes Replied.
function setStatus_(ss, fromSheet, fromRow, received, email, status, when) {
  if (!(received instanceof Date) || !email) return;
  Object.keys(TABS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    var c = cols_(sh);
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      if (v[c['Received']] instanceof Date && v[c['Received']].getTime() === received.getTime() &&
          String(v[c['Email']]).toLowerCase() === String(email).toLowerCase()) {
        if (!(sh.getName() === fromSheet.getName() && i + 2 === fromRow) || v[c['Status']] !== status) {
          sh.getRange(i + 2, c['Status'] + 1).setValue(status);
        }
        if (status === 'Replied' && c['Replied on'] !== undefined && !v[c['Replied on']]) {
          sh.getRange(i + 2, c['Replied on'] + 1).setValue(when || new Date());
        }
        break;
      }
    }
  });
}

/* ---------------- Sheet setup ---------------- */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = Object.keys(TABS);

  names.forEach(function (name, i) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name, i);
    var cols = TABS[name];
    var built = sh.getRange(1, 1).getValue() === cols[0][0];
    var existing = built ? sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0] : [];
    if (built && cols.every(function (col) { return existing.indexOf(col[0]) !== -1; })) return;

    var header = sh.getRange(1, 1, 1, cols.length);
    header.setValues([cols.map(function (c) { return c[0]; })])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#5b3cc4')
      .setVerticalAlignment('middle');
    sh.setRowHeight(1, 34);
    sh.setFrozenRows(1);
    cols.forEach(function (c, j) { sh.setColumnWidth(j + 1, c[1]); });

    var body = sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length);
    body.setVerticalAlignment('top').setWrap(true);
    var headers = cols.map(function (c) { return c[0]; });
    ['Received', 'Replied on', 'Reminder sent', 'Follow-up sent'].forEach(function (h) {
      var idx = headers.indexOf(h);
      if (idx !== -1) sh.getRange(2, idx + 1, sh.getMaxRows() - 1, 1).setNumberFormat('mmm d, yyyy  h:mm am/pm');
    });

    var statusCol = headers.indexOf('Status') + 1;
    var statusRange = sh.getRange(2, statusCol, sh.getMaxRows() - 1, 1);
    statusRange.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUSES, true).setAllowInvalid(false).build());

    var rules = [
      rule_(statusRange, 'New', '#fff4cc'),
      rule_(statusRange, 'Replied', '#dbeafe'),
      rule_(statusRange, 'Booked', '#d1fae5'),
      rule_(statusRange, 'Not a fit', '#eeeeee')
    ];
    var formCol = headers.indexOf('Form') + 1;
    if (formCol) {
      var formRange = sh.getRange(2, formCol, sh.getMaxRows() - 1, 1);
      Object.keys(FORMS).forEach(function (k) { rules.push(rule_(formRange, FORMS[k].label, FORMS[k].color)); });
    }
    sh.setConditionalFormatRules(rules);
  });

  var starter = ss.getSheetByName('Sheet1');
  if (starter && starter.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(starter);
}

/** Run once to switch on the daily follow-up check. Safe to re-run. */
function installFollowUps() {
  setup();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyCheck') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyCheck').timeBased().everyDays(1).atHour(DAILY_CHECK_HOUR).create();
}

function rule_(range, value, color) {
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
    additional_notes: '', file_link: '',
    heard_about: 'Instagram', lead_source: 'Google Ads', lead_campaign: 'test-campaign · country mixing engineer',
    landing_page: '/country-mixing'
  }});
}

// Header name -> 0-based column index for a tab.
function cols_(sh) {
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], m = {};
  h.forEach(function (name, i) { if (name) m[name] = i; });
  return m;
}

function hoursSince_(d, now) { return (now.getTime() - d.getTime()) / 3600000; }
function clean_(v) { return String(v || '').trim().slice(0, 5000); }

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
