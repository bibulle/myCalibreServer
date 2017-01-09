import * as _ from "lodash";
import leftPad = require("left-pad");
import { sign } from "jsonwebtoken";

import DbMyCalibre from "./dbMyCalibre";
import { pbkdf2 } from "crypto";
import { randomBytes } from "crypto";
import { Configuration } from "./configuration";
const debug = require('debug')('server:model:user');

export class User {

  username: string;
  firstname: string;
  lastname: string;
  email: string;

  hashedPassword: string;
  salt: string;

  isAdmin: boolean;

  created: Date;
  updated: Date;

  constructor (options: {}) {
    _.merge(this, options);

    //console.log(this);
  }

  static getAllUsers (): Promise<User[]> {

    return new Promise<User[]>((resolve, reject) => {
      DbMyCalibre.getInstance()
                 .getUsers(1000000, 0)
                 .then((users: User[]) => {

                   debug("done");
                   resolve(users)
                 })
                 .catch(err => {
                   console.log(err);
                   reject(err);
                 });


    });

  }

  static checkUser (username: string, password: string): Promise<User> {

    return new Promise<User>((resolve, reject) => {
      DbMyCalibre.getInstance()
                 .getUser(username || "")
                 .then((user: User) => {
                   if (!user || !user.username) {
                     reject("The username or password don't match.");
                   } else {

                     // check hash
                     User.createHash(password, user.salt || "", function (err, hash: Buffer) {
                       if (err) {
                         console.log(err);
                         return reject("System error.");
                       }

                       if (!(user.hashedPassword === hash.toString("hex"))) {
                         debug("401 : The username or password don't match : 2");
                         return reject("The username or password don't match.");
                       }

                       user = new User(_.pick(user, ['username', 'firstname', 'lastname', 'email', 'isAdmin']));
                       //debug(user);

                       resolve(user);
                       // debug("201 : token created(" + username + ")");
                       // response.status(201).send({
                       //   id_token: UserService.createToken(user)
                     });
                   }

                 })
                 .catch(err => {
                   debug(err);
                   reject(err);
                 })
    });

  }

  /**
   * Generate a salt (for a user)
   * @returns {string}
   */
  static getSalt(): string {
    return randomBytes(128).toString("base64")
  }

  /**
   * Hash a password (to store in Db or compare with login stuff)
   * @param password
   * @param salt
   * @param callback
   */
  static createHash(password: string, salt: string, callback: (err: Error, derivedKey: Buffer) => any) {
    return pbkdf2(password, salt, 10000, Configuration.getInstance().hashedPasswordLength, Configuration.getInstance().hashedPasswordDigest, callback);
  }

  /**
   * Create e JWT token
   * @param user
   * @returns {string|void}
   */
  static createToken(user): string {
    return sign(_.pick(user, ['username', 'firstname', 'lastname', 'email', 'isAdmin', 'id']), Configuration.getInstance().jwt_secret, {expiresIn: "7d"});
  }



}