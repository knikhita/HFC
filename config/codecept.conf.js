exports.config = {
  tests: '../tests/**/*.js',
  output: '../output',
  timeout: 1800000,
  helpers: {
    REST : {
      timeout: 30000
    },
    
    CustomWindowHelper: {
      require: '../helpers/custom-window-helper.js' // I.getWindowHandle(...);
    },
    CustomWebHelper: {
      require: '../helpers/custom-web-helper.js' // I.pressKeys
    },

    CustomClickHelper: {
      require: '../helpers/custom-click-helper.js'
    },
    
    FileSystem : {},
    WebDriver: {
      url: 'https://staging.clubkitchen.at/',
      browser: 'chrome',      
      capabilities: {                
        chromeOptions: {
          args: [ /*"--headless", "--disable-gpu",*/ "--window-size=1900,1200" ],
        },        
      },
    },
  },
  multiple: {
    parallel: {
      chunks: 1,
      browsers: ['chrome', 
      'firefox', 
      'safari'
    ]
    },
  },
  include: {
    I: './steps_file.js'
  },
  mocha: {},
  name: 'QA',
  runner: 'local'

}
