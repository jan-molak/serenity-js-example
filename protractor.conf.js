'use strict';
var allSpecs = 'features/**/*.feature';
require('ts-node/register');
var crew = require('serenity-js/lib/stage_crew');
var init = function (config) {
    const path = require('path');
    var specs;
    for (var i = 3; i < process.argv.length; i++) {
        var match = process.argv[i].match(/^--params\.([^=]+)=(.*)$/);
        if (match)
            switch (match[1]) {
                case 'specs':
                    specs = match[2];
                    break;
                case 'timeout':
                    config.jasmineNodeOpts.defaultTimeoutInterval = parseInt(match[2]);
                    break;
                case 'threads':
                    config.multiCapabilities[0].maxInstances = parseInt(match[2]);
                    config.multiCapabilities[0].shardTestFiles = config.multiCapabilities[0].maxInstances > 1;
                    break;
                case 'seleniumAddress':
                    config.seleniumAddress = match[2];
                    if (config.seleniumAddress === 'http://hub-cloud.browserstack.com/wd/hub') {
                        // config.webDriverProxy = 'http://XXX:9080';
                        config.multiCapabilities[0].proxy = undefined;
                        config.multiCapabilities[0].os = 'Windows';
                        config.multiCapabilities[0].os_version = '10';
                        config.multiCapabilities[0].browserName = 'Chrome';
                        config.multiCapabilities[0].browser_version = '57.0';
                    }
                    break;
                case 'baseUrl':
                    config.baseUrl = match[2];
                    break;
            }
    }

    if (specs) {
        specs.split(/\|/g).forEach(function (dir) {
            if (dir.endsWith('.feature'))
                config.specs.push(dir);
            else
                config.specs.push(path.join(dir, '*.feature'));
        });
    } else {
        config.specs.push(allSpecs);
    }
    return config;
};
exports.config = (function () {
    return init({
        baseUrl: 'http://todomvc.com',
        seleniumAddress: 'http://selenium.k8s04.test1.XXX.de/wd/hub',

        // https://github.com/angular/protractor/blob/master/docs/timeouts.md
        allScriptsTimeout: 600000,
        getPageTimeout: 50000,

        framework: 'custom',
        frameworkPath: require.resolve('serenity-js'),
        specs: [],
        cucumberOpts: {
            require: ['features/**/*.ts', 'env.js'],
            format: 'pretty',
            compiler: 'ts:ts-node/register'
        },
        commonCapabilities: {
            'browserstack.user': process.env.npm_config_browserstack_username || 'XXX',
            'browserstack.key': process.env.npm_config_browserstack_access_key || 'XXX',
            'build': 'protractor-browserstack',
            'name': 'single_test',
            'browserName': 'chrome',
            'resolution': '1024x768',
            'browserstack.debug': 'true'
        },
        multiCapabilities: [
            {
                'browserName': 'chrome',
                'platform': 'ANY',
                'count': 1,
                'shardTestFiles': true,
                'maxInstances': 1,
                'proxy': {
                    'proxyType': 'manual',
                    'httpProxy': 'http://XXX.de:9080',
                    'sslProxy': 'http://XXX.de:9080',
                    'noProxy': 'http://190.100.230.*,*.XXX.de,localhost,127.0.0.1',
                },
                'chromeOptions': {
                    args: ['--no-sandbox', '--test-type=browser', 'incognito',
                        'disable-extensions'],
                    prefs: {
                        'download': {
                            'prompt_for_download': false,
                            'default_directory': '/tmp/'
                        }
                    }
                }
            },
        ],

        // so that every tests starts with a system in a known state
        restartBrowserBetweenTests: true
    });

})();
// Code to support common capabilities
exports.config.multiCapabilities.forEach(function(caps){
    for(var i in exports.config.commonCapabilities) caps[i] = caps[i] || exports.config.commonCapabilities[i];
});
