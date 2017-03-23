import * as _ from "lodash";
import { randomBytes, pbkdf2Sync } from "crypto";

import DbMyCalibre from "./dbMyCalibre";
import { Configuration } from "./configuration";

const debug = require('debug')('server:model:user');


export class User {

  // TODO : see if it's better with an id

  local : {
    email: string,
    hashedPassword: string,
    salt: string
  };

  facebook : {
    id: string,
    token: string,
    email: string,
    name: string,
  };

  twitter : {
    id: string,
    token: string,
    displayName: string,
    username: string,
  };

  google : {
    id: string,
    token: string,
    email: string,
    name: string,
  };

  static conf : Configuration;

  constructor (options: {}) {

    _.merge(this, options);

    //debug(options);
    if (! this.local.salt) {
      this.local.salt = User.generateSalt();
    }
    if (this.local['password']) {
      this.local.hashedPassword = this.generateHash(this.local['password']);
      delete this.local['password'];
    }
    //debug(this);
  }


  static findByEmail(email: string, callback: (err: Error, user: User) => any) {
    DbMyCalibre.getInstance()
      .findUserByEmail(email)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        //debug(err);
        callback(err, null);
      })
  }

  save(callback: (err: Error) => any) {
    DbMyCalibre.getInstance()
               .saveUser(this)
               .then(() => {
                 callback(null);
               })
               .catch(err => {
                 debug(err);
                 callback(err);
               })

  }

  validPassword(password: string): boolean {
    const hash = this.generateHash(password);

    return (this.local.hashedPassword === hash);
  }


  private generateHash(password: string): string {
    return pbkdf2Sync(password, this.local.salt, 10000, User.conf.authent_length, User.conf.authent_digest).toString("hex");
  }

  private static generateSalt(): string {
    return randomBytes(128).toString("base64")
  }



  static init() {
    debug("init...");
    DbMyCalibre.getInstance()
               .getConf()
               .then(conf => {
                 User.conf = conf;
                 debug("init...done");

                 //User.findByEmail("", (err, user) => {
                 //  debug(err);
                 //  debug(user);
                 //});
                 //User.findByEmail("eric@eric.fr", (err, user) => {
                 //  debug(err);
                 //  debug(user);
                 //});
                 //var user = new User({
                 //  local : {
                 //    email : "eric@eric.fr",
                 //    password: "eric"
                 //  }
                 //});

                 //user.save((err) => {
                 //  debug(err);
                 //})

               })
               .catch(err => {
                 debug(err);
               })
  }

}

