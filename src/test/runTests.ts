import { runAllTests } from './testSuite';

async function main() {
  console.log('===========================================================');
  console.log(' EduTrack Attendance System - Automated Verification Suite');
  console.log('===========================================================');

  const summary = await runAllTests();

  console.log(`Executed: ${summary.total} tests in ${summary.totalDurationMs}ms`);
  console.log(`Passed:   ${summary.passed}`);
  console.log(`Failed:   ${summary.failed}`);
  console.log(`Rate:     ${summary.passPercentage}%\n`);

  summary.results.forEach((r) => {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${symbol}] [${r.id}] ${r.name} (${r.durationMs}ms)`);
    if (!r.passed) {
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}`);
    }
  });

  console.log('===========================================================');
  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
