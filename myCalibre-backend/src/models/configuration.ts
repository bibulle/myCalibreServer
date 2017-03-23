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

  constructor (options: {}) {
    _.merge(this, options);

  }
}
