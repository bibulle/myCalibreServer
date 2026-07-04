import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {DatePipe} from '@angular/common';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'localizedDate',
    pure: false // required to update the value when currentLang is changed
    ,
    standalone: false
})
export class LocalizedDatePipe implements PipeTransform {
  private value: string|null = null;
  private lastDate: any;
  private lastLang="";

  constructor(private translate: TranslateService) { }

  transform(date: any, pattern = 'mediumDate'): any {
    // ngx-translate 18: `currentLang` is now a reactive Signal; this pipe is
    // `pure: false` and re-evaluates every CD cycle already, so a plain
    // non-reactive snapshot via `getCurrentLang()` preserves prior behavior.
    const currentLang = this.translate.getCurrentLang() ?? '';

    // if we ask another time for the same date & locale, return the last value
    if (date === this.lastDate && currentLang === this.lastLang) {
      return this.value;
    }

    this.value = new DatePipe(currentLang).transform(date, pattern);
    this.lastDate = date;
    this.lastLang = currentLang;

    return this.value;
  }
}

@NgModule({
  declarations: [LocalizedDatePipe],
  exports: [LocalizedDatePipe]
})
export class LocalizedDateModule {}
