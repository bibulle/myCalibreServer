import { Component, OnInit, Optional } from '@angular/core';
import { MdDialogRef } from "@angular/material";

@Component({
  selector: 'app-kindle-dialog',
  templateUrl: './kindle-dialog.component.html',
  styleUrls: ['./kindle-dialog.component.scss']
})
export class KindleDialogComponent implements OnInit {


  mail: string = "";


  constructor(@Optional() public dialogRef: MdDialogRef<KindleDialogComponent>) { }

  ngOnInit() {
  }

  send() {
    this.dialogRef.close(this.mail);
  }

  cancel() {
    this.dialogRef.close();
  }

}
