
export class User {

  username: string;
  firstname: string;
  lastname: string;
  email: string;
  isAdmin: boolean;

  avatarUrl: string;

  constructor(options) {


    // Init attributes
    this.username = options.username;
    this.firstname = options.firstname;
    this.lastname = options.lastname;
    this.email = options.email;
    this.isAdmin = options.isAdmin;
    this.avatarUrl = options.avatarUrl;
  }
}