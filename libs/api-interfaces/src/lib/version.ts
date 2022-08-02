import * as versionJson from './version.json';


export class Version {
  version: string;
  github_url: string;
  name: string;
  copyright = "2016-2018 - Bibulle";

  constructor() {
    const toto = versionJson;
    this.version = toto.version;
    this.github_url = toto.github_url;
    this.name = toto.name;
    this.copyright = toto.copyright;
  }

}