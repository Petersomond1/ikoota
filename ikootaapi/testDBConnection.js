import { testDBConnection } from './config/db.js'; // Adjust the path to your MySQL config file

(async () => {
    await testDBConnection();
    process.exit(0); // Exit after testing
})();


//node testDBConnection.js
/*Run the above Test: Open your terminal, navigate to your project directory, and use above to run */
