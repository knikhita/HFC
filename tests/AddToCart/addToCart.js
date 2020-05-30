/// <reference path="../../steps.d.ts" />

Feature('AddToCart');

const cheerio = require('cheerio');
const fs = require('fs');
// const CustomWindowHelper = require('./helpers/custom-window-helper.js');

Scenario('Add to cart sanity test suite', async (I,CustomWindowHelper) => {

Scenario('Selection of Mamacita brand', async () => {
  
    I.amOnPage('https://staging.clubkitchen.at/');    
    I.click({css : locate('.banner--link').at(3)});
    await I.wait(3);    

});
Scenario('Verify Mamacita brand link in address bar', async () => {
    I.seeInCurrentUrl('https://staging.clubkitchen.at/speisekarte/mamacita/huetteldorferstr/');   

});

Scenario('Providing address', async () => {
    I.fillField('#address-input','Seidengasse 44, 1070 Wien, Austria');
    I.click('.btn--honest.blattgold--form-banner-submit'); 
    await I.wait(3)  

});

Scenario('Add product to cart', async () => {
    I.click({css : locate('.buybox--button').at(0)});
    const popupWindow = await I.grabAllWindowHandles(); 
    await this.helpers['WebDriver'].browser.switchToWindow(popupWindow);
    I.scrollPageToBottom();
    I.click('#topup-modal--close.btn.is--primary');
    await I.wait(3) 
});

Scenario('Verify Cart value', async () => {
    I.click(); 

});
}).tag('@addToCart');




