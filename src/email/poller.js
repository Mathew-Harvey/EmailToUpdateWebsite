const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('../config');
const logger = require('../logger');
const { parseEmail } = require('./parser');
const { processEmail } = require('./processor');

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const RECONNECT_DELAY_MS = 5 * 1000; // 5 seconds initial delay
const MAX_RECONNECT_DELAY_MS = 5 * 60 * 1000; // 5 minutes max delay

class EmailPoller {
  constructor() {
    this._imap = null;
    this._pollTimer = null;
    this._running = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
  }

  /**
   * Start the email poller. Connects to IMAP and begins polling for unseen emails.
   */
  start() {
    if (this._running) {
      logger.warn('Email poller is already running');
      return;
    }

    this._running = true;
    this._reconnectAttempts = 0;
    logger.info('Starting email poller');
    this._connect();
  }

  /**
   * Stop the email poller. Disconnects from IMAP and clears timers.
   */
  stop() {
    this._running = false;

    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }

    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if (this._imap) {
      try {
        this._imap.end();
      } catch (err) {
        logger.error('Error closing IMAP connection', { error: err.message });
      }
      this._imap = null;
    }

    logger.info('Email poller stopped');
  }

  /**
   * Create and open an IMAP connection.
   */
  _connect() {
    if (!this._running) return;

    logger.info('Connecting to IMAP server', {
      host: config.imap.host,
      user: config.imap.user,
    });

    this._imap = new Imap({
      user: config.imap.user,
      password: config.imap.password,
      host: config.imap.host,
      port: config.imap.port,
      tls: config.imap.tls,
      tlsOptions: config.imap.tlsOptions,
      connTimeout: 30000,
      authTimeout: 15000,
    });

    this._imap.once('ready', () => {
      logger.info('IMAP connection established');
      this._reconnectAttempts = 0;
      this._openInbox();
    });

    this._imap.once('error', (err) => {
      logger.error('IMAP connection error', { error: err.message });
      this._scheduleReconnect();
    });

    this._imap.once('end', () => {
      logger.info('IMAP connection ended');
      if (this._running) {
        this._scheduleReconnect();
      }
    });

    this._imap.once('close', (hadError) => {
      if (hadError) {
        logger.warn('IMAP connection closed due to error');
      }
      if (this._running) {
        this._scheduleReconnect();
      }
    });

    try {
      this._imap.connect();
    } catch (err) {
      logger.error('Failed to initiate IMAP connection', { error: err.message });
      this._scheduleReconnect();
    }
  }

  /**
   * Open the INBOX mailbox and start polling.
   */
  _openInbox() {
    if (!this._imap || !this._running) return;

    this._imap.openBox('INBOX', false, (err) => {
      if (err) {
        logger.error('Failed to open INBOX', { error: err.message });
        this._scheduleReconnect();
        return;
      }

      logger.info('INBOX opened, starting poll cycle');

      // Do an immediate poll
      this._poll();

      // Set up recurring poll
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
      }
      this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL_MS);
    });
  }

  /**
   * Poll for unseen emails.
   */
  _poll() {
    if (!this._imap || !this._running) return;

    this._imap.search(['UNSEEN'], (err, uids) => {
      if (err) {
        logger.error('IMAP search failed', { error: err.message });
        return;
      }

      if (!uids || uids.length === 0) {
        logger.debug('No unseen emails found');
        return;
      }

      logger.info(`Found ${uids.length} unseen email(s)`);

      const fetch = this._imap.fetch(uids, {
        bodies: '',
        markSeen: false, // We mark seen manually after processing
      });

      fetch.on('message', (msg, seqno) => {
        let uid = null;

        msg.on('attributes', (attrs) => {
          uid = attrs.uid;
        });

        msg.on('body', (stream) => {
          this._handleMessage(stream, uid, seqno);
        });
      });

      fetch.once('error', (fetchErr) => {
        logger.error('IMAP fetch error', { error: fetchErr.message });
      });

      fetch.once('end', () => {
        logger.debug('Finished fetching unseen emails');
      });
    });
  }

  /**
   * Handle a single email message stream.
   *
   * @param {ReadableStream} stream - The raw email stream
   * @param {number|null} uid - The email UID
   * @param {number} seqno - The sequence number
   */
  async _handleMessage(stream, uid, seqno) {
    try {
      // Parse the raw email stream
      const parsed = await simpleParser(stream);

      logger.info('Processing email', {
        seqno,
        uid,
        from: parsed.from?.text,
        subject: parsed.subject,
      });

      // Parse the email into a structured command
      const emailData = parseEmail(parsed);

      // Process the command
      await processEmail(emailData);

      // Mark as seen after successful processing
      if (uid && this._imap && this._running) {
        this._imap.addFlags(uid, ['\\Seen'], (err) => {
          if (err) {
            logger.error('Failed to mark email as seen', { uid, error: err.message });
          } else {
            logger.debug('Email marked as seen', { uid });
          }
        });
      }
    } catch (err) {
      logger.error('Error handling email message', {
        seqno,
        uid,
        error: err.message,
        stack: err.stack,
      });

      // Still mark as seen to avoid reprocessing a broken email endlessly
      if (uid && this._imap && this._running) {
        this._imap.addFlags(uid, ['\\Seen'], (flagErr) => {
          if (flagErr) {
            logger.error('Failed to mark errored email as seen', { uid, error: flagErr.message });
          }
        });
      }
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  _scheduleReconnect() {
    if (!this._running) return;

    // Clear existing timers
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }

    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
    }

    // Clean up old IMAP connection
    if (this._imap) {
      try {
        this._imap.removeAllListeners();
        this._imap.end();
      } catch (err) {
        // Ignore errors during cleanup
      }
      this._imap = null;
    }

    // Exponential backoff with jitter
    const baseDelay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, this._reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );
    const jitter = Math.floor(Math.random() * 1000);
    const delay = baseDelay + jitter;

    this._reconnectAttempts++;

    logger.info(`Scheduling IMAP reconnect in ${Math.round(delay / 1000)}s (attempt ${this._reconnectAttempts})`);

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      if (this._running) {
        this._connect();
      }
    }, delay);
  }
}

module.exports = new EmailPoller();
