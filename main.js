/**
 * @file Runs the server in production mode
 * @author Tom Boddaert
 */


import { useProductionDB, default as db } from './db.js';
import { app } from './server.js';

const args = process.argv.slice( 2 );

// If the argument is provided, switch to the production database
if ( args.includes( '--production' ) || args.includes( '-p' ) )
  useProductionDB();
else {
  // Add some example data
  const ZERO = db.addUser( 'userZero', '#888888', 'a', true );
  const ONE = db.addUser( 'userOne', '#cc8888', 'b', true );
  const TWO = db.addUser( 'userTwo', '#88cc88', 'c', true );
  const THREE = db.addUser( 'userThree', '#8888cc', 'd', true );
  const FOUR = db.addUser( 'userFour', '#cccc88', 'e', true );
  const FIVE = db.addUser( 'userFive', '#cc88cc', 'f', false );
  const SIX = db.addUser( 'userSix', '#88cccc', 'g', true );
  const SEVEN = db.addUser( 'userSeven', '#cccccc', 'h', false );

  db.addUserFollow( ZERO, ONE );
  db.addUserFollow( ZERO, THREE );
  db.addUserFollow( ZERO, FIVE );
  db.addUserFollow( ZERO, SEVEN );
  db.addUserFollow( ONE, ZERO );
  db.addUserFollow( ONE, TWO );
  db.addUserFollow( ONE, FOUR );
  db.addUserFollow( ONE, SIX );
  db.addUserFollow( TWO, FOUR );
  db.addUserFollow( TWO, SIX );
  db.addUserFollow( THREE, SIX );

  const date = ( () => {
    let counter = 160;
    return () => counter++ * 10000000000;
  } )();

  db.addPost( ZERO, date(), [
    'Boil some water',
    'Place a teabag into a mug',
    'Add the freshly boiled water to the mug',
    'Leave the tea to steep for three minutes',
    'Remove the teabag',
    'Add some oat milk, making sure you shake it before'
  ], 'Welcome to DrinkShare.\nAs you can probably tell, I\'m drinking tea.' );
  db.addPost( ZERO, date(), [
    'Boil some water',
    'Place the plunger of an Aeropress into the top and invert',
    'Put four teaspoons of espresso grind coffee into the inverted Aeropress',
    'Add the freshly boiled water',
    'Add the filter and filter holder',
    'Leave the coffee to steep for five minutes',
    'Put some oat milk in a mug in the microwave to heat up, making sure you shake it before',
    'Invert the Aeropress over the mug and slowly press the plunger down'
  ], 'Good morning.\nI\'m drinking coffee.' );
  db.addPost( ONE, date(), [
    'Add two inches of ice cubes to a tall glass',
    'Add two shots of Absolute\'s Watermelon Vodka to the glass',
    'Fill with Coca-Cola'
  ], 'Welcome to DrunkShare\nThis \'recipe\' may take a while to taste good.' );
}

// Listen for requests
app.listen( 8080, () => console.log( 'Listening on http://localhost:8080/' ) );
