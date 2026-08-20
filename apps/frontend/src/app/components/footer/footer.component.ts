import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Version } from '@my-calibre-server/api-interfaces';
import { TitleService } from '../../app/title.service';

@Component({
    selector: 'my-calibre-server-docs-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FooterComponent implements OnInit {

  version: Version = new Version();

  constructor(private _titleService: TitleService) { }

  ngOnInit () {
    this._titleService.getVersion()
        .then(v => {
          // console.log(JSON.stringify(v,null,2))
          this.version = v;
        });

  }

}
