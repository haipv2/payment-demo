const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npm test -- payment.service.test.ts --testNamePattern="large"', {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: __dirname
    });
    fs.writeFileSync('test-output.log', 'SUCCESS:\n' + output);
} catch (error) {
    const fullOutput = `STDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nFull Output:\n${error.output ? error.output.join('\n') : 'N/A'}`;
    fs.writeFileSync('test-output.log', fullOutput);
    console.log('Test failed. Output written to test-output.log');
}

