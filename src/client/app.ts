const { app, protocol, BrowserWindow, ipcMain } = require( 'electron' );
const path = require( 'path' );
const url = require( 'url' );
const fs = require( 'fs' );
const mime = require( 'mime' );

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: Electron.BrowserWindow | undefined;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', createWindow );

function requestFileJob( filePath: string, finish: Function )
{
	// console.log( 'read', filePath );

	fs.readFile( filePath, ( err: NodeJS.ErrnoException, buf: NodeBuffer ) =>
	{
		if ( err ) {
			if ( err.errno === 34 ) {
				finish( -6 ); // net::ERR_FILE_NOT_FOUND
				return;
			}
			else {
				finish( -2 ); // net::FAILED
				return;
			}
		}

		finish( {
			data: buf,
			mimeType: mime.lookup( filePath ) || 'text/plain',
		});
	});
}

function createWindow()
{
	protocol.interceptBufferProtocol( 'file', ( request, callback ) =>
	{
		const parsed = url.parse( request.url );
		let filePath = decodeURIComponent( parsed.pathname );

		// console.log( filePath );

		// NB: pathname has a leading '/' on Win32 for some reason
		if ( process.platform === 'win32' ) {
			filePath = filePath.slice( 1 );
		}

		filePath = path.resolve( __dirname, '..', filePath.substring( 'C:/'.length ) );

		// console.log( filePath );

		requestFileJob( filePath, callback );
	},
	function ( err )
	{
		if ( err ) {
			console.error( err );
		}
	});

	// Create the browser window.
	win = new BrowserWindow( { width: 800, height: 600 } );

	// and load the index.html of the app.
	win.loadURL( url.format( {
		protocol: 'file:',
		pathname: path.resolve( '/index.html' ),
		hash: '#!/',
		slashes: true,
	}) );

	// Open the DevTools.
	win.webContents.openDevTools();

	// Emitted when the window is closed.
	win.on( 'closed', () =>
	{
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = undefined;
	});
}

// Quit when all windows are closed.
app.on( 'window-all-closed', () =>
{
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if ( process.platform !== 'darwin' ) {
		app.quit();
	}
});

app.on( 'activate', () =>
{
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if ( win === undefined ) {
		createWindow();
	}
});


// ipcMain.on('asynchronous-message', (event, arg) => {
// 	console.log(arg);  // prints "ping"
// 	event.sender.send('asynchronous-reply', 'pong');
// });

ipcMain.on( 'get-package-json', ( event ) =>
{
	const cwd = path.dirname( __dirname );
	console.log( cwd );

	const packagePath = path.resolve( cwd, 'package.json' );
	console.log( packagePath );

	event.returnValue = require( packagePath );

	// event.returnValue = 'pong';
} );
