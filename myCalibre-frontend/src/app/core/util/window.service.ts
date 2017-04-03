import {Injectable} from "@angular/core";

@Injectable()
export class WindowService {
    constructor() {

    }

    static createWindow(url: string, name: string = 'Window', width: number = 500, height: number = 600) {
        if (url == null) {
            return null;
        }

        const left = (screen.width/2)-(width/2);
        const top = (screen.height/2)-(height/2);

        const options = `width=${width},height=${height},left=${left},top=${top}`;

        return window.open(url, name, options);
    }
}
