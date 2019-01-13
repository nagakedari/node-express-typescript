interface PingI {
  valid: boolean;
}

class Ping implements PingI {
  valid = false;

  constructor(ping: PingI) {
    if (ping) {
      this.valid = ping.valid;
    }
  }
}

export {
  PingI,
  Ping
};
