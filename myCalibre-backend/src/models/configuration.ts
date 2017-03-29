import * as _ from "lodash";

export class Configuration {

  smtp_user_name: string;
  smtp_password: string;
  smtp_server_name: string;
  smtp_port: string;
  smtp_encryption: string;

  authent_secret: string;
  authent_length: number;
  authent_digest: string;

  authent_facebook_clientID: string;
  authent_facebook_clientSecret: string;
  authent_facebook_callbackURL: string;

  authent_twitter_consumerKey: string;
  authent_twitter_consumerSecret: string;
  authent_twitter_callbackURL: string;

  authent_google_clientID: string;
  authent_google_clientSecret: string;
  authent_google_callbackURL: string;

  constructor (options: {}) {
    _.merge(this, options);

  }
}
