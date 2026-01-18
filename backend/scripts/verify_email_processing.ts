import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.EMAIL_USER as string,
  password: process.env.EMAIL_PASS as string,
  host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.EMAIL_IMAP_PORT || '993', 10),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const IGNORED_SENDERS = [
  'mailer-daemon', 'no-reply', 'noreply', 'postmaster',
  'security', 'accounts.google.com', 'facebookmail.com',
  'discordapp.com', 'discord.com', 'linkedin.com',
  'notifications', 'alert', 'support'
];

const JUNK_SUBJECTS = [
  'delivery status', 'failure', 'security alert',
  'verify your email', 'password', 'login', 'sign in',
  'undelivered', 'returned mail', 'confirmation'
];

const imap = new Imap(config);

function checkEmail(parsed: any) {
    const subject = parsed.subject || 'No Subject';
    const from = parsed.from?.value[0];
    const senderEmail = from?.address || 'unknown';
    
    console.log(`\nAnalyzing Email: "${subject}" from ${senderEmail}`);

    const senderLower = senderEmail.toLowerCase();
    if (IGNORED_SENDERS.some((ignored) => senderLower.includes(ignored))) {
         console.log('Result: SKIPPED (Ignored Sender)');
         return;
    }

    const subjectLower = subject.toLowerCase();
    if (JUNK_SUBJECTS.some((junk) => subjectLower.includes(junk))) {
        console.log('Result: SKIPPED (Junk Subject)');
        return;
    }

    // Check attachments
    let hasResume = false;
    if (parsed.attachments && parsed.attachments.length > 0) {
        for (const att of parsed.attachments) {
            console.log(` - Attachment: ${att.filename}`);
            if (att.filename && (
                att.filename.toLowerCase().endsWith('.pdf') ||
                att.filename.toLowerCase().endsWith('.doc') ||
                att.filename.toLowerCase().endsWith('.docx')
            )) {
                hasResume = true;
            }
        }
    } else {
        console.log(' - No attachments found.');
    }

    if (!hasResume) {
        console.log('Result: SKIPPED (No valid resume attachment found [.pdf, .doc, .docx])');
        return;
    }

    console.log('Result: WOULD PROCESS (Valid)');
}

imap.once('ready', () => {
  console.log('IMAP connected.');
  imap.openBox('INBOX', false, (err, box) => {
    if (err) { console.error(err); return; }
    
    imap.search(['ALL', ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000)]], (searchErr, results) => {
      if (searchErr || !results.length) {
        console.log('No recent emails.');
        imap.end();
        return;
      }
      
      const f = imap.fetch(results, { bodies: '' });
      let promises: Promise<void>[] = [];

      f.on('message', (msg) => {
        msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString('utf8'));
            stream.once('end', () => {
                promises.push(simpleParser(buffer).then(checkEmail).catch(e => console.error(e)));
            });
        });
      });

      f.once('end', () => {
        setTimeout(async () => {
            await Promise.all(promises);
            imap.end();
        }, 2000);
      });
    });
  });
});

imap.connect();
