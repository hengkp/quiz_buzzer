#!/usr/bin/env node

/**
 * Command-line test runner for Progress Character White Script
 * Usage: node run_progress_white_test.js [options]
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Logging functions with colors
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    header: (msg) => console.log(`${colors.bright}${colors.cyan}🎯 ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.magenta}📝${colors.reset} ${msg}`)
};

function showHeader() {
    console.log(`
${colors.bright}${colors.cyan}====================================================
🎯 Progress Character White Script Test Runner
====================================================${colors.reset}
`);
}

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        log.error(`Failed to read file: ${filePath}`);
        return null;
    }
}

function testScriptSyntax() {
    log.header('Testing Script Syntax');
    
    const scriptPath = path.join(__dirname, 'set_progress_white.js');
    
    if (!checkFileExists(scriptPath)) {
        log.error('set_progress_white.js not found!');
        return false;
    }
    
    log.success('set_progress_white.js found');
    
    const scriptContent = readFile(scriptPath);
    if (!scriptContent) {
        return false;
    }
    
    // Basic syntax checks for namespaced functions
    const checks = [
        {
            name: 'setProgressCharacterToWhite function',
            test: scriptContent.includes('ProgressWhite.setProgressCharacterToWhite')
        },
        {
            name: 'resetProgressToWhite function',
            test: scriptContent.includes('ProgressWhite.resetProgressToWhite')
        },
        {
            name: 'getWhiteTeamColors function',
            test: scriptContent.includes('ProgressWhite.getWhiteTeamColors')
        },
        {
            name: 'Color distance calculation',
            test: scriptContent.includes('ProgressWhite.calculateColorDistance')
        },
        {
            name: 'Animation caching',
            test: scriptContent.includes('ProgressWhite.animationCache')
        },
        {
            name: 'Visor preservation',
            test: scriptContent.includes('originalVisor') && scriptContent.includes('originalVisorShadow')
        },
        {
            name: 'Smart initialization',
            test: scriptContent.includes('ProgressWhite.initialize') && scriptContent.includes('ProgressWhite.autoInit')
        },
        {
            name: 'Error handling',
            test: scriptContent.includes('console.error') && scriptContent.includes('try') && scriptContent.includes('catch')
        }
    ];
    
    let passed = 0;
    checks.forEach(check => {
        if (check.test) {
            log.success(`${check.name}`);
            passed++;
        } else {
            log.error(`${check.name}`);
        }
    });
    
    log.info(`Syntax checks: ${passed}/${checks.length} passed`);
    return passed === checks.length;
}

function testHtmlFiles() {
    log.header('Testing HTML Files');
    
    const files = [
        {
            name: 'among_us.html',
            path: path.join(__dirname, 'among_us.html'),
            required: ['id="progressCharacter"', 'lottie-player']
        },
        {
            name: 'test_progress_white.html',
            path: path.join(__dirname, 'test_progress_white.html'),
            required: ['id="progressCharacter"', 'set_progress_white.js']
        }
    ];
    
    let allPassed = true;
    
    files.forEach(file => {
        log.step(`Checking ${file.name}...`);
        
        if (!checkFileExists(file.path)) {
            log.error(`${file.name} not found`);
            allPassed = false;
            return;
        }
        
        const content = readFile(file.path);
        if (!content) {
            allPassed = false;
            return;
        }
        
        let filePassed = true;
        file.required.forEach(requirement => {
            if (!content.includes(requirement)) {
                log.error(`${file.name} missing: ${requirement}`);
                filePassed = false;
                allPassed = false;
            }
        });
        
        if (filePassed) {
            log.success(`${file.name} is properly configured`);
        }
    });
    
    return allPassed;
}

function testAnimationFiles() {
    log.header('Testing Animation Files');
    
    const animationsDir = path.join(__dirname, 'assets', 'animations');
    const requiredAnimations = [
        'Among Us - Idle.json',
        'Among Us - Run.json'
    ];
    
    if (!checkFileExists(animationsDir)) {
        log.error('assets/animations directory not found');
        return false;
    }
    
    let allFound = true;
    
    requiredAnimations.forEach(animation => {
        const animationPath = path.join(animationsDir, animation);
        if (checkFileExists(animationPath)) {
            log.success(`${animation} found`);
            
            // Test if it's valid JSON
            const content = readFile(animationPath);
            if (content) {
                try {
                    const data = JSON.parse(content);
                    if (data.layers && Array.isArray(data.layers)) {
                        log.success(`${animation} has valid structure`);
                    } else {
                        log.warning(`${animation} may have invalid structure`);
                    }
                } catch (error) {
                    log.error(`${animation} is not valid JSON`);
                    allFound = false;
                }
            }
        } else {
            log.error(`${animation} not found`);
            allFound = false;
        }
    });
    
    return allFound;
}

function generateTestReport() {
    log.header('Test Summary');
    
    const tests = [
        { name: 'Script Syntax', fn: testScriptSyntax },
        { name: 'HTML Files', fn: testHtmlFiles },
        { name: 'Animation Files', fn: testAnimationFiles }
    ];
    
    const results = tests.map(test => {
        log.step(`Running ${test.name} test...`);
        const passed = test.fn();
        return { name: test.name, passed };
    });
    
    console.log('\n' + '='.repeat(50));
    log.header('Final Results');
    
    results.forEach(result => {
        if (result.passed) {
            log.success(`${result.name}: PASSED`);
        } else {
            log.error(`${result.name}: FAILED`);
        }
    });
    
    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\n${colors.bright}Overall: ${totalPassed}/${totalTests} tests passed${colors.reset}`);
    
    if (totalPassed === totalTests) {
        log.success('All tests passed! 🎉');
        console.log(`
${colors.green}Ready to use:${colors.reset}
1. Include set_progress_white.js in your HTML
2. Ensure progressCharacter element exists
3. Script will auto-initialize
4. Visit test_progress_white.html for interactive testing
        `);
    } else {
        log.error('Some tests failed. Please fix the issues above.');
        process.exit(1);
    }
}

function showUsage() {
    console.log(`
${colors.bright}Usage:${colors.reset}
  node run_progress_white_test.js [options]

${colors.bright}Options:${colors.reset}
  --help, -h     Show this help message
  --verbose, -v  Show verbose output
  --syntax       Test script syntax only
  --html         Test HTML files only
  --animations   Test animation files only

${colors.bright}Examples:${colors.reset}
  node run_progress_white_test.js
  node run_progress_white_test.js --syntax
  node run_progress_white_test.js --verbose
    `);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }
    
    showHeader();
    
    if (args.includes('--syntax')) {
        testScriptSyntax();
    } else if (args.includes('--html')) {
        testHtmlFiles();
    } else if (args.includes('--animations')) {
        testAnimationFiles();
    } else {
        generateTestReport();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    testScriptSyntax,
    testHtmlFiles,
    testAnimationFiles,
    generateTestReport
}; 