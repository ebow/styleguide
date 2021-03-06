const express = require( 'express' );
const logger = require( 'morgan' );
const viewEngine = require( 'express-handlebars' );
const fs = require( 'fs' );
const path = require( 'path' );
const readPkgUp = require( 'read-pkg-up' );

const app = express();
const pageHandler = require( './routes/page' );
const uiLibraryPath = require( './services/ui-library-path' );
const iframeResizerInjector = require( './services/iframe-resizer-injector' );

const PORT = process.env.NODE_PORT || 3080;
const IP = process.env.NODE_IP || '0.0.0.0';

const viewsDir = path.resolve( __dirname, './views' );

app
	.set( 'view engine', 'handlebars' )
	.set( 'views', viewsDir )
	.engine( 'handlebars', viewEngine( {
		defaultLayout: 'main',
		layoutsDir: path.join( viewsDir, 'layouts' )
	} ) )
	.use( logger( 'dev' ) )
	.use( '/static', express.static( __dirname + '/static' ) )
	.use( '/demo', iframeResizerInjector )
	.get( '/styleguide/*', pageHandler )
	.get( '/', pageHandler );

module.exports = {
	config: function( options = {} ) {
		let { uiLibrary, demos } = options;

		if ( !uiLibrary ) {
			throw new Error( 'STYLEGUIDE: UI library path must be configured.' );
		}

		if ( !demos ) {
			throw new Error( 'STYLEGUIDE: Demo routes must be configured.' );
		}

		fs.stat( uiLibrary, err => {
			if ( err ) {
				throw new Error( 'STYLEGUIDE: UI library path not found.' );
			} else {
				uiLibraryPath( uiLibrary );
				readPkgUp().then( result => {
					let defaults = {
						styleguide: { title: 'Aconex Styleguide' }
					};
					app.locals.lib_package = Object.assign( {}, defaults, result.pkg );
				} );
				// eslint-disable-next-line no-console
				console.log( `STYLEGUIDE: Using ui library at '${uiLibraryPath()}'.` );
			}
		} );

		demos( app, express );
		return this;
	},
	start: function() {
		app.listen( PORT, IP, () => process.stdout.write( `STYLEGUIDE: Running at http:\/\/${IP}:${PORT}\n` ) );
		return this;
	}
};
