import { Component, OnInit } from '@angular/core';
import { TitleService, Version } from "../../app/title.service";

@Component({
  selector: 'docs-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  version: Version = new Version({});

  constructor(private _titleService: TitleService) { }

  ngOnInit () {
    this._titleService.getVersion()
        .then(v => {
          this.version = v;
        });

  }

}