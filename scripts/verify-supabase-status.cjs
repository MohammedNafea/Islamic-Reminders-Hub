const dns = require('dns');

const hostname = 'cohcnmqarjvoradzlsov.supabase.co';

console.log(`Checking DNS resolution for ${hostname}...`);

dns.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.error('DNS Resolution Failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.log('\n--- IMPORTANT NOTE ---');
    console.log('This usually means the Supabase project is currently PAUSED or has been deleted.');
    console.log('Please go to the Supabase Dashboard:');
    console.log(`https://supabase.com/dashboard/project/siimuzrjiobhxftntppr`);
    console.log('And click "Restore" or "Resume" to activate the database.');
  } else {
    console.log('DNS Resolution Succeeded!');
    console.log('IP Addresses:', addresses);
    console.log('You can now run the database migration and ingestion scripts!');
  }
});
