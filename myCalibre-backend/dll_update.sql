ALTER TABLE config ADD authent_facebook_clientID TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_facebook_clientSecret TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_facebook_callbackURL TEXT NULL DEFAULT NULL;

ALTER TABLE config ADD authent_twitter_consumerKey TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_twitter_consumerSecret TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_twitter_callbackURL TEXT NULL DEFAULT NULL;

ALTER TABLE config ADD authent_google_clientID TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_google_clientSecret TEXT NULL DEFAULT NULL;
ALTER TABLE config ADD authent_google_callbackURL TEXT NULL DEFAULT NULL;

ALTER TABLE user ADD id TEXT NOT NULL DEFAULT random();
ALTER TABLE user ADD facebook_id TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD facebook_token TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD facebook_email TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD facebook_name TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD twitter_id TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD twitter_token TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD twitter_displayName TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD twitter_username TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD google_id TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD google_token TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD google_email TEXT NULL DEFAULT NULL;
ALTER TABLE user ADD google_name TEXT NULL DEFAULT NULL;

CREATE TABLE user_copy
(
  id TEXT PRIMARY KEY,
  local_username TEXT,
  local_firstname TEXT,
  local_lastname TEXT,
  local_email TEXT,
  local_isAdmin BOOLEAN,
  local_hashedPassword TEXT,
  local_salt TEXT,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  facebook_id TEXT,
  facebook_token TEXT,
  facebook_email TEXT,
  facebook_name TEXT,
  twitter_id TEXT,
  twitter_token TEXT,
  twitter_displayName TEXT,
  twitter_username TEXT,
  google_id TEXT,
  google_token TEXT,
  google_email TEXT,
  google_name TEXT
);

INSERT INTO user_copy (id, local_username, local_firstname, local_lastname, local_email, local_isAdmin, local_hashedPassword, local_salt, facebook_id, facebook_token, facebook_email, facebook_name, twitter_id, twitter_token, twitter_displayName, twitter_username, google_id, google_token, google_email, google_name)
  SELECT random(), local_username, local_firstname, local_lastname, local_email, local_isAdmin, local_hashedPassword, local_salt, facebook_id, facebook_token, facebook_email, facebook_name, twitter_id, twitter_token, twitter_displayName, twitter_username, google_id, google_token, google_email, google_name FROM user;

DROP TABLE user;
ALTER TABLE user_copy RENAME TO user;
