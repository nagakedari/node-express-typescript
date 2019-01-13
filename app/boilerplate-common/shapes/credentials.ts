interface  CredentialsI {
  username?: string;
  password?: string;
}

class Credentials {
  username: string;
  password: string;

  constructor();
  constructor(username?: string, password?: string);
  constructor(username?:any, password?:any) {
    if (username) {
      this.username = username;
      if (password) {
        // only set password if username exists
        this.password = password;
      }
    }
  }
}

export {
  CredentialsI,
  Credentials
};


