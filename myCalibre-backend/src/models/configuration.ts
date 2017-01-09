import * as _ from "lodash";
import DbMyCalibre from "./dbMyCalibre";
const debug = require('debug')('server:models:configuration');

export class Configuration {

  smtp_user_name: string;
  smtp_password: string;
  smtp_server_name: string;
  smtp_port: string;
  smtp_encryption: string;

  jwt_secret: string;
  hashedPasswordLength: number;
  hashedPasswordDigest: string;

  private static _instance: Configuration;


  constructor () {

    if (Configuration._instance) {
      throw new Error("Error: Instantiation failed: Use Configuration.getInstance() instead of new.");
    }

    DbMyCalibre.getInstance()
               .getConfAsRow()
               .then(row => {
                 _.merge(this, row);
               })
               .catch(err => {
                 debug(err);
               });
  }

  public static getInstance (): Configuration {
    return Configuration._instance;

  }

  public static init() {
    if (!Configuration._instance) {
      Configuration._instance = new Configuration();
    }
  }

}
