const { db } = require('../db');

module.exports = function notify(userId, message) {
  if (!userId || !message) return;
  db.run(
    'INSERT INTO notifications(user_id, message) VALUES(?, ?)',
    [userId, message],
    () => {}
  );
};
