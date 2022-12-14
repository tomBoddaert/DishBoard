/**
 * @file Runs the server in production mode
 * @author Tom Boddaert
 */


import { useProductionDB } from './db.js';
import { app } from './server.js';

// Switch to the production database
useProductionDB();

// Listen for requests
app.listen( 8080, () => console.log( 'Listening on http://localhost:8080/' ) );
