/// <reference path="../steps.d.ts" />
'use strict';
let Helper = codecept_helper;


class CustomWindowHelper extends Helper {    

    async getWindowHandle() {
        return await this.helpers['WebDriver'].browser.getWindowHandle();
    }

    async switchToWindow(handle) {
        await this.helpers['WebDriver'].browser.switchToWindow(handle);
    }
    
}

module.exports = CustomWindowHelper;