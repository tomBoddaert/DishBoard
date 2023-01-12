/**
 * @file Runs the server in production mode
 * @author Tom Boddaert
 */


import { useProductionDB, default as db } from './db.js';
import { app } from './server.js';

const args = process.argv.slice( 2 );

// Listen for requests
app.listen( 8080, () => console.log( 'Listening on http://localhost:8080/' ) );


// If the argument is provided, switch to the production database, otherwise
//  add some example data
if ( args.includes( '--production' ) || args.includes( '-p' ) )
  useProductionDB();
else {
  for ( let i = 0; i < 50; i++ ) {
    const user = db.addUser(
      `testUser-${ i }`,
      `#${ ( i * 0x200a05 % 0xfb00c0 ).toString( 16 ).padStart( 6, '0' ) }`,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@£$%^&*()[{]};:\'"\\|/?,<.>'[
        i % 88
      ]
    );
    for ( let j = 0; j < i; j++ )
      db.addUserFollow( user, j );

    db.addPost( user, 0, [
      'This post is generated to test',
      'Page functionality with a large',
      'Number of items'
    ], `This is test post #${ i }` );
  }

  const ZERO = db.addUser( 'userZero', '#888888', 'a' );
  const ONE = db.addUser( 'userOne', '#cc8888', 'b' );
  const TWO = db.addUser( 'userTwo', '#88cc88', 'c' );
  const THREE = db.addUser( 'userThree', '#8888cc', 'd' );
  const FOUR = db.addUser( 'userFour', '#cccc88', 'e' );
  const FIVE = db.addUser( 'userFive', '#cc88cc', 'f' );
  const SIX = db.addUser( 'userSix', '#88cccc', 'g' );
  const SEVEN = db.addUser( 'userSeven', '#cccccc', 'h' );

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
    'Add cut aubergine and courgette into medium-sized cubes to a roasting tin',
    'Add sliced peppers and onions into medium squares',
    'Add whole, peeled garlic cloves',
    'Drizzle with olive oil, and heavily sprinkle with pepper flakes',
    'Roast for 15 minutes at 200°C fan, mixing at 10 minutes, if it looks done by this point, stop',
    'Serve on orzo, with fried halloumi'
  ], 'This is a recipe for roasted vegetables, you can pretty much add any vegetable you want\
 to it.' );
  db.addPost( ONE, date(), [
    'Dice half a brown / yellow onion and about 3 cloves of garlic (add more if you want)',
    'Slice 80g of chestnut mushrooms',
    'Fry the garlic in olive oil with pepper flakes and a pinch of salt for a minute',
    'Add the onion, mushrooms and two teaspoons of sugar and fry until browning',
    'Add a drained 400g tin of Cannellini beans, two 400g tins of chopped tomatoes, and\
 3 teaspoons of dried or fresh oregano',
    'Add about 20 black olives',
    'Let it reduce to a sauce-like consistency',
    'Serve with spaghetti and vegetarian parmesan'
  ], 'Welcome to DishBoard!\nFor copyright reasons, I have come up with all the recipes on here.\
 I do not recommend trying any of them, and will not be held responsible if they make you ill.' );
}
